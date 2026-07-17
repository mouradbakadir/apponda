import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { redis } from '../src/config/redis.js';

let token;
let marcheId;
let equipementId;
let panneId;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'sup.cmn@onda.ma', password: 'sup123' });
  token = res.body.accessToken;

  const suffix = Date.now();

  // Creation de donnees de test totalement isolees des autres fichiers de test
  const marcheRes = await request(app)
    .post('/api/marches')
    .set('Authorization', `Bearer ${token}`)
    .send({
      numeroMarche: `MCH-KPI-TEST-${suffix}`,
      objet: 'Marche isole pour test KPI soft delete',
      typeMaintenance: 'PREVENTIVE',
      slaDisponibilite: 95,
      slaPrr: 90,
      slaMrt: 60,
      dateDebut: '2026-01-01',
      dateFin: '2026-12-31',
    });
  marcheId = marcheRes.body.id;

  const societeRes = await request(app)
    .post('/api/societes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      marcheId,
      raisonSociale: `Societe Test KPI ${suffix}`,
      rcNumber: `RC-${suffix}`,
      ice: '000000000000000',
      adresse: 'Adresse test',
      telephone: '0500000000',
      emailContact: `test${suffix}@example.com`,
      emailNotification: `test${suffix}@example.com`,
      contactUrgenceNom: 'Test',
      contactUrgenceTel: '0600000000',
    });
  const societeId = societeRes.body.id;

  const equipementRes = await request(app)
    .post('/api/equipements')
    .set('Authorization', `Bearer ${token}`)
    .send({
      marcheId,
      societeId,
      codeEquipement: `EQ-KPI-TEST-${suffix}`,
      designation: 'Equipement isole pour test KPI',
      categorie: 'CVC',
      localisation: 'Zone test',
    });
  equipementId = equipementRes.body.id;
});

async function clearKpiCache() {
  // Necessaire car il n'existe pas encore d'invalidation automatique du cache
  // (defaut identifie separement, hors scope de cette correction)
  await redis.flushall();
}

describe('KPI — filtrage soft delete', () => {
  it('exclut une panne supprimee (soft delete) du calcul de disponibilite', async () => {
    const createRes = await request(app)
      .post('/api/pannes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        equipementId,
        tPanne: '2026-07-05T08:00:00.000Z',
        causePanne: 'USURE',
        description: 'Panne de test soft delete',
        impact: 'MAJEUR',
      });
    panneId = createRes.body.id;

    await request(app)
      .patch(`/api/pannes/${panneId}/close`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tReprise: '2026-07-05T10:00:00.000Z' }); // 120 minutes d'arret

    await clearKpiCache();

    const kpiAvant = await request(app)
      .get(`/api/kpi/marche/${marcheId}?dateDebut=2026-07-01&dateFin=2026-07-31`)
      .set('Authorization', `Bearer ${token}`);
    const dispoAvant = kpiAvant.body.kpi.disponibilite.valeur;

    expect(typeof dispoAvant).toBe('number');
    expect(dispoAvant).toBeLessThan(100);

    // Soft delete direct (le module Pannes n'expose pas encore de DELETE)
    await prisma.panne.update({ where: { id: panneId }, data: { deletedAt: new Date() } });

    await clearKpiCache();

    const kpiApres = await request(app)
      .get(`/api/kpi/marche/${marcheId}?dateDebut=2026-07-01&dateFin=2026-07-31`)
      .set('Authorization', `Bearer ${token}`);
    const dispoApres = kpiApres.body.kpi.disponibilite.valeur;

    expect(typeof dispoApres).toBe('number');
    expect(dispoApres).toBeGreaterThan(dispoAvant);
    expect(dispoApres).toBe(100);
  });
});