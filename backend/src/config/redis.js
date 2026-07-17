import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

// Création de l'instance Redis
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

redis.on('connect', () => {
  logger.info('🟢 Connecté au cache Redis');
});

redis.on('error', (err) => {
  logger.error({ err }, '🔴 Erreur de connexion Redis');
});