import 'dotenv/config';

const requiredVars = ['PORT', 'DATABASE_URL', 'FRONTEND_URL'];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`❌ Variable d'environnement manquante : ${key}`);
  }
}

export const env = {
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL,
};