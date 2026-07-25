import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ champ: i.path.join('.'), message: i.message }));
    return next(new AppError(400, 'Erreur de validation des données', 'VALIDATION_ERROR', details));
  }
  req.body = result.data;
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ champ: i.path.join('.'), message: i.message }));
    return next(new AppError(400, 'Erreur de validation des paramètres', 'VALIDATION_ERROR', details));
  }
  req.query = result.data;
  next();
};