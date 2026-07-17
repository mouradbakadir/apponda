import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, airportId: user.airportId },
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