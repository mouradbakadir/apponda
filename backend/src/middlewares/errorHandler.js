import fs from 'fs';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Le fichier dépasse la taille maximale autorisée (50 Mo)' // cohérent avec MAX_FILE_SIZE_BYTES dans middlewares/upload.js
      : 'Erreur lors de l\'upload du fichier';
    return res.status(400).json({ error: { message, code: err.code } });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ 
      error: { 
        message: err.message, 
        code: err.code,
        ...(err.details && { details: err.details }) 
      } 
    });
  }

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
  
  try {
    fs.writeFileSync('DEBUG_ERROR.txt', err.stack || err.message || JSON.stringify(err));
  } catch(e) {}

  res.status(500).json({ error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' } });
}