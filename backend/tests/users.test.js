import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

let tokenSuperAdmin;
let tokenSuperviseur;

beforeAll(async () => {
  // Login du Super Admin
  const resAdmin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@onda.ma', password: 'admin123' });
  tokenSuperAdmin = resAdmin.body.accessToken;

  // Login d'un Superviseur classique
  const resSup = await request(app)
    .post('/api/auth/login')
    .send({ email: 'sup.cmn@onda.ma', password: 'sup123' });
  tokenSuperviseur = resSup.body.accessToken;
});

describe('Utilisateurs API', () => {
  it('refuse l\'accès à un Superviseur (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenSuperviseur}`);
    expect(res.status).toBe(403);
  });

  it('autorise l\'accès à un Super Admin (200 OK)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenSuperAdmin}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });
});