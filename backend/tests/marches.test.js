import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

let tokenSuperviseur;
let tokenTechnicien;

beforeAll(async () => {
  const resSup = await request(app).post('/api/auth/login').send({ email: 'sup.cmn@onda.ma', password: 'sup123' });
  tokenSuperviseur = resSup.body.accessToken;

  const resTech = await request(app).post('/api/auth/login').send({ email: 'tech.cmn@onda.ma', password: 'tech123' });
  tokenTechnicien = resTech.body.accessToken;
});

describe('GET /api/marches', () => {
  it('refuse sans token (401)', async () => {
    const res = await request(app).get('/api/marches');
    expect(res.status).toBe(401);
  });

  it('liste les marches pour un superviseur authentifié (200)', async () => {
    const res = await request(app).get('/api/marches').set('Authorization', `Bearer ${tokenSuperviseur}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/marches (RBAC)', () => {
  const nouveauMarche = {
    numeroMarche: `MCH-TEST-${Date.now()}`,
    objet: 'Marché de test automatisé',
    typeMaintenance: 'PREVENTIVE',
    slaDisponibilite: 97,
    slaPrr: 90,
    slaMrt: 45,
    dateDebut: '2026-01-01',
    dateFin: '2026-12-31',
  };

  it('refuse la création pour un technicien (403)', async () => {
    const res = await request(app).post('/api/marches').set('Authorization', `Bearer ${tokenTechnicien}`).send(nouveauMarche);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('autorise la création pour un superviseur (201)', async () => {
    const res = await request(app).post('/api/marches').set('Authorization', `Bearer ${tokenSuperviseur}`).send(nouveauMarche);
    expect(res.status).toBe(201);
    expect(res.body.numeroMarche).toBe(nouveauMarche.numeroMarche);
  });
});