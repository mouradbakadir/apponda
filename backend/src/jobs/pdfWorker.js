import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

const worker = new Worker('reports-queue', async (job) => {
  logger.info(`👷 WORKER : Début de la génération du rapport ${job.id} (Type: ${job.name})`);
  logger.info(`👷 WORKER : Paramètres reçus -> ${JSON.stringify(job.data)}`);

  // On simule une tâche super longue (ex: 5 secondes pour générer un gros PDF)
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Ici on pourrait utiliser une librairie comme "pdfkit" ou "puppeteer"
  const fakePdfLink = `http://localhost:4000/downloads/rapport_${job.id}.pdf`;

  logger.info(`✅ WORKER : Rapport généré avec succès ! Lien : ${fakePdfLink}`);
  
  // (Optionnel) Tu pourrais envoyer un email à l'utilisateur ici !
  return fakePdfLink;
}, { connection: redis });

worker.on('failed', (job, err) => {
  logger.error({ err }, `❌ WORKER : Le job ${job.id} a échoué !`);
});

export default worker;