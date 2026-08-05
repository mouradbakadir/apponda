import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

// Ce test appelle réellement le fournisseur IA actif (AI_PROVIDER) --
// relance-le une fois avec AI_PROVIDER=ollama, une fois avec
// AI_PROVIDER=gemini (redémarrage des conteneurs entre les deux, comme
// pour les tests d'extraction) : les mêmes assertions doivent passer dans
// les deux cas, c'est la preuve que emailGenerationService.js est bien
// indépendant du fournisseur.

let tokenSuperviseur;
let superviseurAirportId;
let createdIds = { societeId: null, equipementId: null, panneId: null, reclamationId: null };

beforeAll(async () => {
  const resSup = await request(app).post('/api/auth/login').send({ email: 'sup.cmn@onda.ma', password: 'sup123' });
  tokenSuperviseur = resSup.body.accessToken;
  superviseurAirportId = resSup.body.user.airportId;

  // Un marché doit déjà exister pour cet aéroport -- on en récupère un
  // existant plutôt que d'en créer un nouveau, pour rester minimal.
  const marche = await prisma.marche.findFirst({ where: { airportId: superviseurAirportId, deletedAt: null } });
  if (!marche) throw new Error('Aucun marché trouvé pour cet aéroport -- impossible de construire la chaîne de test');

  const societe = await prisma.societe.create({
    data: {
      airportId: superviseurAirportId,
      marcheId: marche.id,
      raisonSociale: 'Société Test Email IA',
      rcNumber: 'RC-TEST-001',
      ice: '000000000000000',
      adresse: '1 Rue de Test, Agadir',
      telephone: '0500000000',
      emailContact: 'contact@societe-test.ma',
      emailNotification: 'notif@societe-test.ma',
      contactUrgenceNom: 'Test Urgence',
      contactUrgenceTel: '0600000000',
    },
  });
  createdIds.societeId = societe.id;

  const equipement = await prisma.equipement.create({
    data: {
      airportId: superviseurAirportId,
      marcheId: marche.id,
      societeId: societe.id,
      codeEquipement: `EQ-TEST-${Date.now()}`,
      designation: 'Ascenseur Terminal 1',
      categorie: 'ASCENSEUR',
      localisation: 'Terminal 1, Niveau 0',
    },
  });
  createdIds.equipementId = equipement.id;

  const panne = await prisma.panne.create({
    data: {
      airportId: superviseurAirportId,
      equipementId: equipement.id,
      tPanne: new Date('2026-07-01T08:00:00Z'),
      tReprise: new Date('2026-07-01T10:00:00Z'),
      causePanne: 'DEFAUT_MECANIQUE',
      description: "Blocage de la cabine entre le rez-de-chaussée et le niveau 1",
      impact: 'MAJEUR',
      statut: 'RESOLUE',
    },
  });
  createdIds.panneId = panne.id;

  const reclamation = await prisma.reclamation.create({
    data: {
      airportId: superviseurAirportId,
      panneId: panne.id,
      objet: "Retard d'intervention sur ascenseur",
      tNotification: new Date('2026-07-01T08:05:00Z'),
      moyenNotification: 'EMAIL',
      tArrivee: new Date('2026-07-01T09:30:00Z'),
      tempsReactionMinutes: 85,
      conformeSla: false,
    },
  });
  createdIds.reclamationId = reclamation.id;
});

afterAll(async () => {
  if (createdIds.reclamationId) await prisma.reclamation.delete({ where: { id: createdIds.reclamationId } }).catch(() => {});
  if (createdIds.panneId) await prisma.panne.delete({ where: { id: createdIds.panneId } }).catch(() => {});
  if (createdIds.equipementId) await prisma.equipement.delete({ where: { id: createdIds.equipementId } }).catch(() => {});
  if (createdIds.societeId) await prisma.societe.delete({ where: { id: createdIds.societeId } }).catch(() => {});
  await prisma.$disconnect();
});

describe('Génération d\'e-mail via IA (fournisseur actif = AI_PROVIDER)', () => {
  it('génère un email exploitable (objet + corps non vides) pour une notification de panne', async () => {
    const res = await request(app)
      .post(`/api/reclamations/${createdIds.reclamationId}/generate-email`)
      .set('Authorization', `Bearer ${tokenSuperviseur}`)
      .send({
        type: 'NOTIF_PANNE',
        urgence: 'URGENT',
        signataire: 'Mourad Bakadir',
        fonction: 'Responsable Maintenance',
      });

    expect(res.status).toBe(200);
    expect(typeof res.body.objet).toBe('string');
    expect(res.body.objet.length).toBeGreaterThan(0);
    expect(typeof res.body.corps).toBe('string');
    expect(res.body.corps.length).toBeGreaterThan(0);
    expect(res.body.destinataireSuggere).toBe('contact@societe-test.ma');
  }, 60_000);

  it('refuse la génération pour une réclamation inexistante (404)', async () => {
    const res = await request(app)
      .post('/api/reclamations/00000000-0000-0000-0000-000000000000/generate-email')
      .set('Authorization', `Bearer ${tokenSuperviseur}`)
      .send({ type: 'RELANCE_1', urgence: 'NORMAL' });

    expect(res.status).toBe(404);
  });
});