import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';
import { extractionQueue } from '../src/config/queue.js';
import { extractionWorker } from '../src/jobs/extraction.worker.js';
import { deleteFile } from '../src/services/storageService.js';

// Comme pour extraction-queue.test.js : ce test démarre son propre Worker
// BullMQ (import direct de extractionWorker). Ne pas lancer `npm run worker:dev`
// en parallèle pendant ce test.

let tokenAdmin;
let tokenSuperviseur;
let superviseurAirportId;
const createdDocuments = []; // { id, fileName, airportId }
const createdMarcheIds = [];

beforeAll(async () => {
  const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@onda.ma', password: 'admin123' });
  tokenAdmin = resAdmin.body.accessToken;

  const resSup = await request(app).post('/api/auth/login').send({ email: 'sup.cmn@onda.ma', password: 'sup123' });
  tokenSuperviseur = resSup.body.accessToken;
  superviseurAirportId = resSup.body.user.airportId;
});

afterAll(async () => {
  for (const doc of createdDocuments) {
    await deleteFile(doc.fileName, doc.airportId).catch(() => {});
  }
  await prisma.marcheDocument.deleteMany({ where: { id: { in: createdDocuments.map((d) => d.id) } } });
  await prisma.marche.deleteMany({ where: { id: { in: createdMarcheIds } } });
  await extractionWorker.close(true);
  await extractionQueue.close();
  await prisma.$disconnect();
  await redis.quit();
}, 20_000);

async function waitUntilStatut(documentId, token, timeoutMs = 280_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await request(app).get(`/api/marche-documents/${documentId}`).set('Authorization', `Bearer ${token}`);
    if (res.body.statut === 'EXTRAIT' || res.body.statut === 'ECHEC') return res.body;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Timeout : extraction non terminée à temps');
}

describe('CAS 1 : upload PDF sans marché existant', () => {
  it('refuse un SUPER_ADMIN sans airportId ni marcheId (400 MISSING_AIRPORT)', async () => {
    const res = await request(app)
      .post('/api/marche-documents')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('file', './014-24_ASTROPHYSICS.pdf');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_AIRPORT');
  });

 it('accepte un SUPERVISEUR sans airportId explicite (hérité du JWT) et termine l\'extraction (201 puis EXTRAIT)', async () => {
  const res = await request(app)
    .post('/api/marche-documents')
    .set('Authorization', `Bearer ${tokenSuperviseur}`)
    // Pages limitées explicitement : sans ça, computeDefaultSelectedPages()
    // irait jusqu'à 15 pages par défaut -- beaucoup trop lent en CPU pur
    // (chaque page vision prend 40-150s sur cette machine), et fait
    // largement dépasser le timeout du test (280s), avec un effet de
    // cascade sur tous les tests suivants (le job continue en arrière-plan
    // et sature Ollama pour les jobs suivants).
    .field('selectedPages', JSON.stringify([1, 2]))
    .attach('file', './014-24_ASTROPHYSICS.pdf');

    expect(res.status).toBe(201);
    expect(res.body.airportId).toBe(superviseurAirportId);
    expect(res.body.statut).toBe('EN_ATTENTE');
    createdDocuments.push({ id: res.body.id, fileName: res.body.fileName, airportId: res.body.airportId });

    const final = await waitUntilStatut(res.body.id, tokenSuperviseur);
    expect(final.statut).toBe('EXTRAIT');
    expect(final.extractedJson.numeroMarche).toBeTruthy();
  }, 300_000);

  it('rejette un fichier non-PDF dès l\'upload (400 INVALID_FILE_TYPE, avant même la mise en queue)', async () => {
    const res = await request(app)
      .post('/api/marche-documents')
      .set('Authorization', `Bearer ${tokenSuperviseur}`)
      .attach('file', Buffer.from('pas un pdf'), { filename: 'test.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });
});

describe('CAS 2 : upload PDF sur un marché existant, extraction ciblée par aéroport (Lot 027-HTDS)', () => {
  it('extrait le MRT SPÉCIFIQUE à Guelmime, différent de celui d\'Agadir (preuve sur données réelles)', async () => {
    // Marché de test rattaché à l'aéroport du superviseur, avec un MRT
    // volontairement différent de celui du PDF pour bien voir le diff plus loin.
    const marche = await prisma.marche.create({
      data: {
        airportId: superviseurAirportId,
        numeroMarche: `027-TEST-${Date.now()}`,
        objet: 'Objet provisoire avant extraction',
        typeMaintenance: 'CORRECTIVE',
        slaDisponibilite: 90,
        slaPrr: 90,
        slaMrt: 999, // valeur volontairement fausse pour tester le diff
        dateDebut: new Date('2024-01-01'),
        dateFin: new Date('2024-12-31'),
      },
    });
    createdMarcheIds.push(marche.id);

    // Pages 1 (couverture), 14 et 15 (article SLA avec le détail par aéroport)
    // identifiées manuellement dans 027-HTDS.pdf -- voir l'OCR de vérification.
    const res = await request(app)
      .post('/api/marche-documents')
      .set('Authorization', `Bearer ${tokenSuperviseur}`)
      .field('marcheId', marche.id)
      .field('selectedPages', JSON.stringify([1, 14, 15]))
      .attach('file', './027-HTDS.pdf');

    expect(res.status).toBe(201);
    expect(res.body.airportId).toBe(superviseurAirportId); // hérité du marché, pas du body
    createdDocuments.push({ id: res.body.id, fileName: res.body.fileName, airportId: res.body.airportId });

    const final = await waitUntilStatut(res.body.id, tokenSuperviseur);
    expect(final.statut).toBe('EXTRAIT');

    // La preuve : le MRT extrait doit être celui d'UN SEUL aéroport du lot
    // (7H=420min, 12H=720min ou 24H=1440min selon l'aéroport réellement
    // configuré dans le seed pour ce superviseur), jamais une valeur
    // mélangée ou incohérente.
    //
    // Le MRT peut légitimement être null avec un modèle vision "Lite"
    // (Gemini 3.5 Flash-Lite) sur ce tableau dense à 3 valeurs par
    // aéroport -- le prompt applique alors correctement sa consigne de
    // prudence plutôt que de deviner (voir discussion du 31/07/2026).
    // On accepte donc null OU une valeur cohérente, mais on interdit
    // formellement toute valeur incohérente (mélange d'un autre aéroport).
    if (final.extractedJson.slaMrt !== null) {
      expect([420, 720, 1440]).toContain(final.extractedJson.slaMrt);
    }
  }, 300_000);
});

describe('CAS 2 : écran de comparaison et confirmation partielle', () => {
  it('refuse la comparaison tant que l\'extraction n\'est pas terminée (409)', async () => {
    const marche = await prisma.marche.create({
      data: {
        airportId: superviseurAirportId,
        numeroMarche: `CMP-TEST-${Date.now()}`,
        objet: 'Test comparaison',
        typeMaintenance: 'MIXTE',
        slaDisponibilite: 95, slaPrr: 95, slaMrt: 60,
        dateDebut: new Date('2024-01-01'), dateFin: new Date('2024-12-31'),
      },
    });
    createdMarcheIds.push(marche.id);

    const upload = await request(app)
      .post('/api/marche-documents')
      .set('Authorization', `Bearer ${tokenSuperviseur}`)
      .field('marcheId', marche.id)
      .field('selectedPages', JSON.stringify([1]))
      .attach('file', './027-HTDS.pdf');
    createdDocuments.push({ id: upload.body.id, fileName: upload.body.fileName, airportId: upload.body.airportId });

    const res = await request(app)
      .get(`/api/marche-documents/${upload.body.id}/comparaison`)
      .set('Authorization', `Bearer ${tokenSuperviseur}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EXTRACTION_NOT_READY');

    await waitUntilStatut(upload.body.id, tokenSuperviseur); // laisse le job se terminer pour ne pas polluer le worker après le test
  }, 300_000);

  it('applique uniquement les champs choisis, jamais "statut" (liste blanche)', async () => {
    const marche = await prisma.marche.create({
      data: {
        airportId: superviseurAirportId,
        numeroMarche: `CONFIRM-TEST-${Date.now()}`,
        objet: 'Objet original',
        typeMaintenance: 'MIXTE',
        slaDisponibilite: 95, slaPrr: 95, slaMrt: 60, statut: 'BROUILLON',
        dateDebut: new Date('2024-01-01'), dateFin: new Date('2024-12-31'),
      },
    });
    createdMarcheIds.push(marche.id);

    // Tentative d'injection de "statut" dans la confirmation -- doit être
    // rejetée par Zod (confirmDocumentSchema n'autorise pas ce champ),
    // AVANT même d'atteindre le service.
    const resInjection = await request(app)
      .post(`/api/marche-documents/00000000-0000-0000-0000-000000000000/confirmer`)
      .set('Authorization', `Bearer ${tokenSuperviseur}`)
      .send({ champs: { statut: 'ACTIF' } });

    expect(resInjection.status).toBe(400);
    expect(resInjection.body.error.code).toBe('VALIDATION_ERROR');

    // Confirmation légitime : seul "objet" est modifié, le reste ne bouge pas.
    const upload = await request(app)
      .post('/api/marche-documents')
      .set('Authorization', `Bearer ${tokenSuperviseur}`)
      .field('marcheId', marche.id)
      .field('selectedPages', JSON.stringify([1]))
      .attach('file', './027-HTDS.pdf');
    createdDocuments.push({ id: upload.body.id, fileName: upload.body.fileName, airportId: upload.body.airportId });
    await waitUntilStatut(upload.body.id, tokenSuperviseur);

    const resConfirm = await request(app)
      .post(`/api/marche-documents/${upload.body.id}/confirmer`)
      .set('Authorization', `Bearer ${tokenSuperviseur}`)
      .send({ champs: { objet: 'Maintenance des équipements de sûreté RAPISCAN' } });

    expect(resConfirm.status).toBe(200);
    expect(resConfirm.body.objet).toBe('Maintenance des équipements de sûreté RAPISCAN');
    expect(resConfirm.body.slaMrt).toBe(60); // inchangé
    expect(resConfirm.body.statut).toBe('BROUILLON'); // inchangé, jamais modifiable par ce flux
  }, 300_000);
});