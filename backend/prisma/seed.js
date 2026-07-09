import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // 1. Aéroports (extrait — tu peux réutiliser la liste complète de seed.js du projet original)
  const cmn = await prisma.airport.upsert({
    where: { codeIata: 'CMN' },
    update: {},
    create: {
      codeIata: 'CMN',
      codeOaci: 'GMMN',
      nom: 'Mohammed V',
      ville: 'Casablanca',
    },
  });

  const rak = await prisma.airport.upsert({
    where: { codeIata: 'RAK' },
    update: {},
    create: {
      codeIata: 'RAK',
      codeOaci: 'GMMX',
      nom: 'Marrakech-Ménara',
      ville: 'Marrakech',
    },
  });

  // 2. Utilisateurs de test (mots de passe hashés avec bcrypt)
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordSup = await bcrypt.hash('sup123', 10);
  const passwordTech = await bcrypt.hash('tech123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@onda.ma' },
    update: {},
    create: {
      email: 'admin@onda.ma',
      passwordHash: passwordAdmin,
      nom: 'Bakadir',
      prenom: 'Mourad',
      role: 'SUPER_ADMIN',
      // pas d'airportId : vue nationale
    },
  });

  await prisma.user.upsert({
    where: { email: 'sup.cmn@onda.ma' },
    update: {},
    create: {
      email: 'sup.cmn@onda.ma',
      passwordHash: passwordSup,
      nom: 'Superviseur',
      prenom: 'CMN',
      role: 'SUPERVISEUR',
      airportId: cmn.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'tech.cmn@onda.ma' },
    update: {},
    create: {
      email: 'tech.cmn@onda.ma',
      passwordHash: passwordTech,
      nom: 'Technicien',
      prenom: 'CMN',
      role: 'TECHNICIEN',
      airportId: cmn.id,
    },
  });

  console.log('✅ Seed terminé.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });