import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/prisma.js';
import { redis } from './config/redis.js';
import './jobs/pdfWorker.js';
import { extractionWorker } from './jobs/extraction.worker.js';

const server = app.listen(env.port, () => {
  logger.info(`🚀 API ONDA démarrée en mode ${process.env.NODE_ENV} sur le port ${env.port}`);
});

// Fonction d'arrêt propre
const gracefulShutdown = async (signal) => {
  logger.info(`\n🛑 Signal ${signal} reçu. Fermeture propre du serveur...`);
  
  server.close(async () => {
    logger.info('✅ Toutes les requêtes HTTP en cours sont terminées.');
    
    try {
      await extractionWorker.close();
    } catch (_) {}

    // Fermer proprement la Base de données et le Cache
    await prisma.$disconnect();
    logger.info('✅ Déconnexion de PostgreSQL réussie.');
    
    await redis.quit();
    logger.info('✅ Déconnexion de Redis réussie.');
    
    logger.info('👋 Extinction complète. Au revoir !');
    process.exit(0);
  });

  // Si après 10 secondes ça ne veut pas s'éteindre, on force
  setTimeout(() => {
    logger.error('❌ Arrêt forcé après 10 secondes.');
    process.exit(1);
  }, 10000);
};

// Écoute les signaux d'arrêt de Windows/Linux/Docker
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));