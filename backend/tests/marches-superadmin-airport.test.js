import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let tokenAdmin;
let tokenSuperviseur;
let superviseurAirportId;
let autreAirportId;

beforeAll(async () => {
  const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@onda.ma', password: 'admin123' });
  tokenAdmin = resAdmin.body.accessToken;

  const resSup = await request(app).post('/api/auth/login').send({ email: 'sup.cmn@onda.ma', password: 'sup123' });
  tokenSuperviseur = resSup.body.accessToken;
  superviseurAirportId = resSup.body.user.airportId;

  // On récupère un aéroport DIFFÉRENT de celui du superviseur, pour le test
  // d'injection ci-dessous (on veut prouver qu'on ne peut PAS créer un
  // marché dans un aéroport qui n'est pas le sien, même en le demandant
  // explicitement dans le body).
  const airports = await prisma.airport.findMany({ where: { id: { not: superviseurAirportId } }, take: 1 });
  autreAirportId = airports[0]?.id;
});

function baseMarche(overrides = {}) {
  return {
    numeroMarche: `MCH-SA-TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    objet: 'Marché de test SUPER_ADMIN',
    typeMaintenance: 'PREVENTIVE',
    slaDisponibilite: 97,
    slaPrr: 90,
    slaMrt: 45,
    dateDebut: '2026-01-01',
    dateFin: '2026-12-31',
    ...overrides,
  };
}

describe('POST /api/marches — règle multi-aéroports (SUPER_ADMIN)', () => {
  it('refuse la création SANS airportId pour un SUPER_ADMIN (400 MISSING_AIRPORT)', async () => {
    const res = await request(app)
      .post('/api/marches')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(baseMarche());

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_AIRPORT');
  });

  it('refuse la création avec un airportId inexistant (400 INVALID_AIRPORT)', async () => {
    const res = await request(app)
      .post('/api/marches')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(baseMarche({ airportId: '00000000-0000-0000-0000-000000000000' }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_AIRPORT');
  });

  it('autorise la création avec un airportId valide, et l\'enregistre correctement (201)', async () => {
    const res = await request(app)
      .post('/api/marches')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(baseMarche({ airportId: superviseurAirportId }));

    expect(res.status).toBe(201);
    expect(res.body.airportId).toBe(superviseurAirportId);
  });
});

describe('POST /api/marches — un non-admin ne peut jamais choisir l\'aéroport', () => {
  it('ignore un airportId envoyé par un SUPERVISEUR et force son propre aéroport (201)', async () => {
    if (!autreAirportId) {
      // Environnement de seed avec un seul aéroport : le test de non-régression
      // n'a pas de sens ici, mais on ne fait pas échouer la suite pour autant.
      return;
    }

    const res = await request(app)
      .post('/api/marches')
      .set('Authorization', `Bearer ${tokenSuperviseur}`)
      .send(baseMarche({ airportId: autreAirportId })); // tentative d'injection

    expect(res.status).toBe(201);
    // La preuve de sécurité : peu importe ce que le client a envoyé,
    // l'airportId enregistré est TOUJOURS celui du superviseur (JWT).
    expect(res.body.airportId).toBe(superviseurAirportId);
    expect(res.body.airportId).not.toBe(autreAirportId);
  });
});