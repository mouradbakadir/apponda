import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';
import { extractionQueue } from '../src/config/queue.js';
import { saveFile, deleteFile } from '../src/services/storageService.js';
import { extractionWorker } from '../src/jobs/extraction.worker.js';

// ATTENTION : ce test nécessite que le WORKER tourne (soit lancé en parallèle
// via `npm run worker:dev` dans un autre terminal, soit -comme ici- démarré
// directement dans le process de test en important extractionWorker).
// On importe extractionWorker directement : ça démarre un vrai Worker BullMQ
// dans le process de test, qui consommera les jobs qu'on ajoute ci-dessous.

let airportId;
let userId;
const createdDocumentIds = [];

beforeAll(async () => {
  // On réutilise les données seedées plutôt que d'en recréer (cohérent avec
  // le reste du projet : comptes de test admin@onda.ma etc.)
  const airport = await prisma.airport.findFirst();
  const user = await prisma.user.findFirst();
  if (!airport || !user) {
    throw new Error('Base de données non seedée : lancer `npm run seed` avant les tests');
  }
  airportId = airport.id;
  userId = user.id;
});

afterAll(async () => {
  // Nettoyage : on supprime les documents de test créés (DB + fichiers disque)
  for (const doc of createdDocumentIds) {
    await deleteFile(doc.fileName, doc.airportId).catch(() => {});
  }
  await prisma.marcheDocument.deleteMany({ where: { id: { in: createdDocumentIds.map((d) => d.id) } } });
  await extractionWorker.close();
  await extractionQueue.close();
  await prisma.$disconnect();
  await redis.quit();
});

/** Attend qu'une condition devienne vraie, avec timeout (le worker traite en arrière-plan). */
async function waitUntil(predicate, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Timeout : la condition attendue ne s\'est pas réalisée à temps');
}

describe('Étape C : queue + worker d\'extraction PDF', () => {
  it('traite un vrai PDF de marché de bout en bout (EN_ATTENTE -> EN_COURS -> EXTRAIT)', async () => {
    const buffer = Buffer.from('%PDF-1.4 contenu minimal pour test'); // un vrai PDF suffit à passer la vérification de signature
    const saved = await saveFile({ buffer, originalName: 'test-marche.pdf', airportId });

    const document = await prisma.marcheDocument.create({
      data: {
        airportId,
        fileName: saved.fileName,
        originalName: 'test-marche.pdf',
        mimeType: 'application/pdf',
        sizeBytes: saved.sizeBytes,
        uploadedById: userId,
        statut: 'EN_ATTENTE',
      },
    });
    createdDocumentIds.push({ id: document.id, fileName: saved.fileName, airportId });

    await extractionQueue.add('extract-marche-pdf', { documentId: document.id });

    await waitUntil(async () => {
      const updated = await prisma.marcheDocument.findUnique({ where: { id: document.id } });
      return updated.statut === 'EXTRAIT';
    });

    const final = await prisma.marcheDocument.findUnique({ where: { id: document.id } });
    expect(final.statut).toBe('EXTRAIT');
    expect(final.extractedJson).toBeTruthy();
    expect(final.extractedJson.tailleFichierOctets).toBe(buffer.length);
  });

  it('marque le document ECHEC si le fichier n\'est pas un PDF valide', async () => {
    const buffer = Buffer.from('CECI N\'EST PAS UN PDF');
    const saved = await saveFile({ buffer, originalName: 'corrompu.pdf', airportId });

    const document = await prisma.marcheDocument.create({
      data: {
        airportId,
        fileName: saved.fileName,
        originalName: 'corrompu.pdf',
        mimeType: 'application/pdf',
        sizeBytes: saved.sizeBytes,
        uploadedById: userId,
        statut: 'EN_ATTENTE',
      },
    });
    createdDocumentIds.push({ id: document.id, fileName: saved.fileName, airportId });

    // attempts: 1 pour ne pas attendre le backoff exponentiel par défaut pendant le test
    await extractionQueue.add('extract-marche-pdf', { documentId: document.id }, { attempts: 1 });

    await waitUntil(async () => {
      const updated = await prisma.marcheDocument.findUnique({ where: { id: document.id } });
      return updated.statut === 'ECHEC';
    });

    const final = await prisma.marcheDocument.findUnique({ where: { id: document.id } });
    expect(final.statut).toBe('ECHEC');
    expect(final.erreurMessage).toContain('%PDF-');
  });
});