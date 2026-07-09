import { AppError } from '../utils/AppError.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
  }
  console.error('❌ Erreur non gérée :', err);
  res.status(500).json({ error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' } });
}