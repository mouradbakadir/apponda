import { prisma } from '../config/prisma.js';
import { comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../utils/AppError.js';
import bcrypt from 'bcryptjs';

export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new AppError(401, 'Identifiants invalides', 'INVALID_CREDENTIALS');
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Identifiants invalides', 'INVALID_CREDENTIALS');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: await hashPassword(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role, airportId: user.airportId },
  };
}

export async function refresh(oldRefreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new AppError(401, 'Refresh token invalide', 'INVALID_REFRESH_TOKEN');
  }

  const storedTokens = await prisma.refreshToken.findMany({
    where: { userId: payload.sub, revoked: false, expiresAt: { gt: new Date() } },
  });

  let matchedToken = null;
  for (const t of storedTokens) {
    if (await bcrypt.compare(oldRefreshToken, t.tokenHash)) {
      matchedToken = t;
      break;
    }
  }
  if (!matchedToken) {
    throw new AppError(401, 'Refresh token invalide ou révoqué', 'INVALID_REFRESH_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  // CORRECTION Bug Critique 2 : un compte désactivé ou supprimé ne doit PAS
  // pouvoir obtenir un nouveau access token, même avec un refresh token valide.
  if (!user || !user.isActive || user.deletedAt !== null) {
    // On révoque également tous ses tokens pour forcer la déconnexion totale
    await prisma.refreshToken.updateMany({
      where: { userId: payload.sub, revoked: false },
      data: { revoked: true },
    });
    throw new AppError(401, 'Compte désactivé ou supprimé', 'ACCOUNT_DISABLED');
  }

  // Rotation : on révoque l'ancien, on en émet un nouveau
  await prisma.refreshToken.update({ where: { id: matchedToken.id }, data: { revoked: true } });

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: await hashPassword(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(userId) {
  await prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
}