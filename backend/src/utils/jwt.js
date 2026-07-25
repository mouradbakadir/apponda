import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    // CORRECTION Étape 4 : ajout de l'email dans le payload
    // pour qu'il soit disponible via req.user dans tous les middlewares
    { sub: user.id, role: user.role, airportId: user.airportId, email: user.email },
    env.jwtAccessSecret,
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id },
    env.jwtRefreshSecret,
    { expiresIn: '7d', algorithm: 'HS256' }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret, { algorithms: ['HS256'] });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret, { algorithms: ['HS256'] });
}