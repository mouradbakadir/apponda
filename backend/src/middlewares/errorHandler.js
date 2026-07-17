import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
  }

  // Filet de sécurité : erreurs Prisma non interceptées explicitement par un service
  if (err.code === 'P2002') {
    return res.status(409).json({ error: { message: 'Cette donnée existe déjà (contrainte unique violée)', code: 'DUPLICATE_ENTRY' } });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: { message: 'Enregistrement introuvable', code: 'NOT_FOUND' } });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ error: { message: 'Référence invalide (clé étrangère)', code: 'INVALID_REFERENCE' } });
  }

  logger.error({ 
    err, 
    req: { method: req.method, url: req.url, body: req.body } 
  }, 'Une erreur non gérée est survenue');
  res.status(500).json({ error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' } });
}