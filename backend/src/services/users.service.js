import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../utils/paginate.js';
import bcrypt from 'bcryptjs';

export async function getAll(tenantFilter, query = {}) {
  const { page = 1, limit = 10, role, search } = query;
  const where = { ...tenantFilter, deletedAt: null };
  if (role) where.role = role;

  return paginate(prisma.user, {
    where,
    select: { id: true, email: true, nom: true, prenom: true, role: true, airportId: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  }, page, limit);
}

export async function getById(id, tenantFilter) {
  const user = await prisma.user.findFirst({
    where: { id, ...tenantFilter, deletedAt: null },
    select: { id: true, email: true, nom: true, prenom: true, role: true, airportId: true, isActive: true, createdAt: true }
  });
  if (!user) throw new AppError(404, 'Utilisateur introuvable', 'NOT_FOUND');
  return user;
}

export async function create(data) {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new AppError(409, 'Cet email est deja utilise', 'EMAIL_ALREADY_EXISTS');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const { password, ...userData } = data;

  return prisma.user.create({
    data: { ...userData, passwordHash },
    select: { id: true, email: true, role: true }
  });
}

export async function update(id, data, tenantFilter) {
  await getById(id, tenantFilter);

  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }

  // Si on desactive explicitement le compte, on revoque immediatement
  // toutes ses sessions actives (refresh tokens), en meme temps que la
  // mise a jour du compte, de facon atomique.
  const isDeactivating = data.isActive === false;

  if (isDeactivating) {
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data,
        select: { id: true, email: true, role: true, isActive: true }
      }),
      prisma.refreshToken.updateMany({
        where: { userId: id, revoked: false },
        data: { revoked: true }
      }),
    ]);
    return updatedUser;
  }

  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, role: true, isActive: true }
  });
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);

  // Soft delete + revocation immediate de toutes les sessions actives,
  // dans une seule transaction atomique : impossible d'avoir un etat
  // intermediaire ou l'utilisateur est "supprime" mais garde une session valide.
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    }),
    prisma.refreshToken.updateMany({
      where: { userId: id, revoked: false },
      data: { revoked: true }
    }),
  ]);

  return updatedUser;
}