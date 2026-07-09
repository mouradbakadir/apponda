import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentification requise', 'UNAUTHENTICATED'));
  }
  const token = header.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, airportId: payload.airportId };
    next();
  } catch {
    next(new AppError(401, 'Token invalide ou expiré', 'INVALID_TOKEN'));
  }
}