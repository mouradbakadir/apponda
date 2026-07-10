import { AppError } from '../utils/AppError.js';

export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(', ');
    return next(new AppError(400, message, 'VALIDATION_ERROR'));
  }
  // Express 5 : req.query est en lecture seule, on stocke le résultat validé ailleurs
  req.validatedQuery = result.data;
  next();
};