import rateLimit from 'express-rate-limit';

// Limiteur pour le login : 10 tentatives max par 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 tentatives max par IP
  standardHeaders: true,     // Renvoie les headers RateLimit-*
  legacyHeaders: false,      // Désactive les headers X-RateLimit-* (obsolètes)
  validate: { xForwardedForHeader: false },
  message: {
    error: {
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
      code: 'RATE_LIMITED',
    },
  },
});

// Limiteur pour le refresh : 60 requêtes max par 15 minutes
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    error: {
      message: 'Trop de requêtes de rafraîchissement. Réessayez dans 15 minutes.',
      code: 'RATE_LIMITED',
    },
  },
});