import 'dotenv/config';

const requiredVars = ['PORT', 'DATABASE_URL', 'FRONTEND_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`❌ Variable d'environnement manquante : ${key}`);
  }
}

// Sécurité : les secrets JWT doivent faire au minimum 32 caractères
if (process.env.JWT_ACCESS_SECRET.length < 32) {
  throw new Error('❌ JWT_ACCESS_SECRET doit avoir au moins 32 caractères');
}
if (process.env.JWT_REFRESH_SECRET.length < 32) {
  throw new Error('❌ JWT_REFRESH_SECRET doit avoir au moins 32 caractères');
}

export const env = {
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
};