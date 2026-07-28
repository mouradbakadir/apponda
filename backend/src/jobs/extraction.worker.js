import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { prisma } from '../config/prisma.js';
import { readFile } from '../services/storageService.js';
import { extractDocument } from '../services/extractionService.js';
import { logger } from '../utils/logger.js';

const CONCURRENCY = 2;

async function processExtractionJob(job) {
  const { documentId } = job.data;
  logger.info(`👷 [extraction-worker] Job ${job.id} : début du traitement du document ${documentId}`);

  const document = await prisma.marcheDocument.findUnique({ where: { id: documentId } });
  if (!document) {
    throw new Error(`Document ${documentId} introuvable en base (a-t-il été supprimé ?)`);
  }

  // On récupère l'aéroport AVANT toute extraction -- c'est le contexte de
  // vérité (issu de tenantScope à l'upload), jamais déduit du contenu PDF.
  const airport = await prisma.airport.findUnique({ where: { id: document.airportId } });
  if (!airport) {
    throw new Error(`Aéroport ${document.airportId} introuvable (données incohérentes)`);
  }

  await prisma.marcheDocument.update({
    where: { id: documentId },
    data: { statut: 'EN_COURS' },
  });

  try {
    const buffer = await readFile(document.fileName, document.airportId);

    if (!document.selectedPages || document.selectedPages.length === 0) {
      throw new Error('Aucune page sélectionnée pour ce document (selectedPages vide)');
    }

    const { extractedJson, confidenceScore, rawTextLength, airportMentioned } = await extractDocument(
      buffer,
      document.selectedPages,
      { nom: airport.nom, ville: airport.ville }
    );

    logger.info(`👷 [extraction-worker] Extraction terminée : confiance ${confidenceScore}%, aéroport mentionné : ${airportMentioned}`);

    await prisma.marcheDocument.update({
      where: { id: documentId },
      data: { statut: 'EXTRAIT', extractedJson, confidenceScore },
    });

    return extractedJson;
  } catch (err) {
    await prisma.marcheDocument.update({
      where: { id: documentId },
      data: { statut: 'ECHEC', erreurMessage: err.message },
    });
    throw err;
  }
}

export const extractionWorker = new Worker('extraction-queue', processExtractionJob, {
  connection: redis,
  concurrency: CONCURRENCY,
});

extractionWorker.on('completed', (job) => logger.info(`✅ [extraction-worker] Job ${job.id} terminé`));
extractionWorker.on('failed', (job, err) => {
  const attemptsInfo = job ? `(tentative ${job.attemptsMade}/${job.opts.attempts})` : '';
  logger.error({ err }, `❌ [extraction-worker] Job ${job?.id} échoué ${attemptsInfo}`);
});