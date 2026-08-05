import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';
import { extractionQueue } from '../src/config/queue.js';
import { saveFile, deleteFile } from '../src/services/storageService.js';
import { extractionWorker } from '../src/jobs/extraction.worker.js';

// ATTENTION : ce test démarre son propre Worker BullMQ en important
// extractionWorker directement. Ne PAS avoir `npm run worker:dev` actif
// dans un autre terminal en même temps -- deux workers écoutant la même
// queue peuvent traiter le job de façon imprévisible (voir diagnostic
// précédent : ça a fait perdre du temps de débogage inutilement).

let airportId;
let userId;
const createdDocumentIds = [];

beforeAll(async () => {
  const airport = await prisma.airport.findFirst();
  const user = await prisma.user.findFirst();
  if (!airport || !user) {
    throw new Error('Base de données non seedée : lancer `npx prisma db seed` avant les tests');
  }
  airportId = airport.id;
  userId = user.id;
});

afterAll(async () => {
  for (const doc of createdDocumentIds) {
    await deleteFile(doc.fileName, doc.airportId).catch(() => {});
  }
  await prisma.marcheDocument.deleteMany({ where: { id: { in: createdDocumentIds.map((d) => d.id) } } });
  // force: true -- évite d'attendre la fin d'un éventuel job encore actif,
  // ce qui dépasserait le hookTimeout Vitest. Ne PAS faire ça dans le vrai
  // processus worker de production (src/worker.js).
  await extractionWorker.close(true);
  await extractionQueue.close();
  await prisma.$disconnect();
  await redis.quit();
}, 20_000);

async function waitUntil(predicate, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Timeout : la condition attendue ne s\'est pas réalisée à temps');
}

describe('Étape D : pipeline complet d\'extraction PDF (queue + worker + Ollama)', () => {
  it('traite un vrai PDF de marché de bout en bout (EN_ATTENTE -> EN_COURS -> EXTRAIT)', async () => {
    const fs = await import('fs/promises');
    const buffer = await fs.readFile('./014-24_ASTROPHYSICS.pdf');

    const saved = await saveFile({ buffer, originalName: '014-24_ASTROPHYSICS.pdf', airportId });

    const document = await prisma.marcheDocument.create({
      data: {
        airportId, fileName: saved.fileName, originalName: '014-24_ASTROPHYSICS.pdf',
        mimeType: 'application/pdf', sizeBytes: saved.sizeBytes,
        uploadedById: userId, statut: 'EN_ATTENTE',
        selectedPages: [1, 2], // couverture + Acte d'Engagement (numéro, objet, montant) -- pas le SLA (Article 17), voir note ci-dessous
      },
    });
    createdDocumentIds.push({ id: document.id, fileName: saved.fileName, airportId });

    await extractionQueue.add('extract-marche-pdf', { documentId: document.id });

    await waitUntil(async () => {
      const updated = await prisma.marcheDocument.findUnique({ where: { id: document.id } });
      return updated.statut === 'EXTRAIT' || updated.statut === 'ECHEC';
    }, 280_000);

    const final = await prisma.marcheDocument.findUnique({ where: { id: document.id } });
    console.log('Statut final :', final.statut, final.erreurMessage || '');
    console.log('extractedJson :', JSON.stringify(final.extractedJson, null, 2));

    expect(final.statut).toBe('EXTRAIT');
    expect(final.extractedJson.numeroMarche).toBeTruthy();

    // slaMrt peut légitimement être null : les pages sélectionnées (1, 2)
    // ne couvrent pas l'Article 17 (SLA), situé plus loin dans le document.
    // La conversion heures->minutes est déjà validée par le test manuel C
    // (texte simulé contenant explicitement le SLA).
    if (final.extractedJson.slaMrt !== null) {
      expect(final.extractedJson.slaMrt).toBeGreaterThanOrEqual(60);
    }
  }, 300_000);

  it('marque le document ECHEC si le fichier n\'est pas un PDF valide', async () => {
    const buffer = Buffer.from('CECI N\'EST PAS UN PDF');
    const saved = await saveFile({ buffer, originalName: 'corrompu.pdf', airportId });

    const document = await prisma.marcheDocument.create({
      data: {
        airportId, fileName: saved.fileName, originalName: 'corrompu.pdf',
        mimeType: 'application/pdf', sizeBytes: saved.sizeBytes,
        uploadedById: userId, statut: 'EN_ATTENTE',
      },
    });
    createdDocumentIds.push({ id: document.id, fileName: saved.fileName, airportId });

    await extractionQueue.add('extract-marche-pdf', { documentId: document.id }, { attempts: 1 });

    await waitUntil(async () => {
      const updated = await prisma.marcheDocument.findUnique({ where: { id: document.id } });
      return updated.statut === 'ECHEC';
    });

    const final = await prisma.marcheDocument.findUnique({ where: { id: document.id } });
    expect(final.statut).toBe('ECHEC');
    expect(final.erreurMessage).toContain('%PDF-');
  }, 30_000);
});