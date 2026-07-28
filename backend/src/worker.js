// Point d'entrée du PROCESSUS WORKER, séparé de l'API (server.js).
// À lancer avec : npm run worker (ou npm run worker:dev en local avec nodemon)
//
// Pourquoi un fichier séparé plutôt qu'un import dans server.js :
// voir le point de vigilance noté dans le projet - un worker qui tourne
// dans le même process que l'API peut la faire planter en cas d'erreur non
// gérée, et se fait interrompre à chaque redémarrage de l'API en dev.

import { env } from './config/env.js'; // valide aussi les variables d'env requises
import { logger } from './utils/logger.js';
import { prisma } from './config/prisma.js';
import { redis } from './config/redis.js';
import { extractionWorker } from './jobs/extraction.worker.js';
import './jobs/pdfWorker.js'; // worker existant (génération de rapports KPI), déplacé ici

logger.info('👷 Processus WORKER démarré (extraction PDF + génération de rapports)');

// Arrêt propre : mêmes principes que server.js (laisser les jobs en cours
// se terminer avant de couper les connexions DB/Redis).
const gracefulShutdown = async (signal) => {
  logger.info(`\n🛑 Signal ${signal} reçu. Fermeture propre du worker...`);

  // Si l'arrêt propre ne se termine pas en 10 secondes (job bloqué, etc.),
  // on force l'arrêt. Ce timer n'est démarré QUE pendant l'arrêt, jamais
  // au chargement du module.
  const forceExitTimer = setTimeout(() => {
    logger.error('❌ Arrêt forcé du worker après 10 secondes.');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref(); // ne doit pas empêcher un arrêt normal plus rapide

  try {
    await extractionWorker.close(); // attend la fin des jobs en cours (jusqu'à un délai interne BullMQ)
    await prisma.$disconnect();
    logger.info('✅ Déconnexion de PostgreSQL réussie.');
    await redis.quit();
    logger.info('✅ Déconnexion de Redis réussie.');
    logger.info('👋 Worker arrêté proprement. Au revoir !');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, '❌ Erreur pendant l\'arrêt du worker');
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));