import { AppError } from '../utils/AppError.js';

export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError(403, 'Accès refusé pour ce rôle', 'FORBIDDEN'));
  }
  next();
};