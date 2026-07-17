import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(', ');
    return next(new AppError(400, message, 'VALIDATION_ERROR'));
  }
  req.body = result.data;
  next();
};

// NOUVEAU : Middleware pour valider req.query (les paramètres URL)
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(', ');
    return next(new AppError(400, message, 'VALIDATION_ERROR'));
  }
  req.query = result.data;
  next();
};