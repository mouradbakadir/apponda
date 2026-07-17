import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const cache = (ttlSeconds = 300) => async (req, res, next) => {
  // On ne met en cache que les requêtes GET (lecture)
  if (req.method !== 'GET') return next();

  // Création d'une clé unique basée sur l'URL de la requête et l'aéroport du tenant
  const key = `cache:${req.user?.airportId || 'global'}:${req.originalUrl}`;

  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      logger.info(`⚡ Cache HIT : ${key}`);
      return res.json(JSON.parse(cachedData));
    }

    logger.info(`🐌 Cache MISS : ${key}`);
    
    // On intercepte la réponse finale pour l'enregistrer dans Redis avant de l'envoyer
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(e => logger.error('Erreur Redis SET', e));
      }
      originalJson.call(this, body);
    };

    next();
  } catch (err) {
    logger.warn('Redis indisponible, on by-pass le cache.');
    next();
  }
};