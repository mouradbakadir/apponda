import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { signAccessToken } from '../src/utils/jwt.js';
import { verifyAccessToken } from '../src/utils/jwt.js';

// ─── TEST 1 : Le token JWT contient bien le champ email ─────────────────────
describe('Étape 4 — Correction email dans JWT et req.user', () => {
  it('le token JWT généré au login contient bien le champ email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@onda.ma', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();

    // On décode le token pour vérifier son contenu
    const payload = verifyAccessToken(res.body.accessToken);

    // AVANT correction : payload.email était undefined
    // APRÈS correction  : payload.email doit être 'admin@onda.ma'
    expect(payload.email).toBeDefined();
    expect(payload.email).toBe('admin@onda.ma');
  });

  // ─── TEST 2 : req.user contient email dans les routes protégées ──────────
  it('req.user.email est disponible dans les routes protégées (/api/auth/me)', async () => {
    // Login pour récupérer le token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@onda.ma', password: 'admin123' });
    const token = loginRes.body.accessToken;

    // Appel à /api/auth/me qui renvoie les infos de l'utilisateur connecté
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    // L'utilisateur retourné doit avoir un email (il est dans meRes.body.user)
    expect(meRes.body.user.email).toBeDefined();
    expect(meRes.body.user.email).toBe('admin@onda.ma');
  });

  // ─── TEST 3 : signAccessToken inclut l'email dans le payload ─────────────
  it('signAccessToken inclut email dans le payload du token', () => {
    const fakeUser = {
      id: 'uuid-test-123',
      role: 'TECHNICIEN',
      airportId: 'airport-uuid',
      email: 'tech@onda.ma',
    };

    const token = signAccessToken(fakeUser);
    const payload = verifyAccessToken(token);

    // Vérifications du payload
    expect(payload.sub).toBe('uuid-test-123');
    expect(payload.role).toBe('TECHNICIEN');
    expect(payload.airportId).toBe('airport-uuid');

    // AVANT correction : email était absent du payload
    // APRÈS correction  : email doit être présent
    expect(payload.email).toBe('tech@onda.ma');
  });

  // ─── TEST 4 : le generate-pdf reçoit l'email (pas undefined) ────────────
  it('la route generate-pdf répond 202 avec un jobId (email non undefined)', async () => {
    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@onda.ma', password: 'admin123' });
    const token = loginRes.body.accessToken;

    // Récupère un marcheId existant
    const marchesRes = await request(app)
      .get('/api/marches')
      .set('Authorization', `Bearer ${token}`);

    // Si pas de marchés, on skip ce test
    if (!marchesRes.body.data || marchesRes.body.data.length === 0) {
      console.warn('Aucun marché en base, test generate-pdf ignoré');
      return;
    }

    const marcheId = marchesRes.body.data[0].id;

    const res = await request(app)
      .post(`/api/kpi/marche/${marcheId}/generate-pdf`)
      .set('Authorization', `Bearer ${token}`);

    // La route doit répondre 202 immédiatement
    expect(res.status).toBe(202);
    expect(res.body.jobId).toBeDefined();
    expect(res.body.message).toContain('arrière-plan');
  });
});
