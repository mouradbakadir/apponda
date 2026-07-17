import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // En local (développement), on affiche de jolies couleurs
  // En production, ça sera du vrai JSON natif très rapide
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname' // Cache les infos inutiles en local
    }
  } : undefined,
});