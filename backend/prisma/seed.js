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
  const aga = await prisma.airport.upsert({
    where: { codeIata: 'AGA' },
    update: { codeOaci: 'GMAD' },
    create: { codeIata: 'AGA', codeOaci: 'GMAD', nom: 'Agadir-Al Massira', ville: 'Agadir' },
  });
  
  const tng = await prisma.airport.upsert({
    where: { codeIata: 'TNG' },
    update: { codeOaci: 'GMTT' },
    create: { codeIata: 'TNG', codeOaci: 'GMTT', nom: 'Tanger Ibn Battouta', ville: 'Tanger' },
  });
  
  const fez = await prisma.airport.upsert({
    where: { codeIata: 'FEZ' },
    update: { codeOaci: 'GMFF' },
    create: { codeIata: 'FEZ', codeOaci: 'GMFF', nom: 'Fès-Saïss', ville: 'Fès' },
  });
  
  const rba = await prisma.airport.upsert({
    where: { codeIata: 'RBA' },
    update: { codeOaci: 'GMME' },
    create: { codeIata: 'RBA', codeOaci: 'GMME', nom: 'Rabat-Salé', ville: 'Rabat' },
  });
  
  const oud = await prisma.airport.upsert({
    where: { codeIata: 'OUD' },
    update: { codeOaci: 'GMFO' },
    create: { codeIata: 'OUD', codeOaci: 'GMFO', nom: 'Oujda Angads', ville: 'Oujda' },
  });
  
  const ndr = await prisma.airport.upsert({
    where: { codeIata: 'NDR' },
    update: { codeOaci: 'GMMW' },
    create: { codeIata: 'NDR', codeOaci: 'GMMW', nom: 'Nador-Al Aroui', ville: 'Nador' },
  });
  
  const ahu = await prisma.airport.upsert({
    where: { codeIata: 'AHU' },
    update: { codeOaci: 'GMTA' },
    create: { codeIata: 'AHU', codeOaci: 'GMTA', nom: 'Al Hoceima - Cherif Al Idrissi', ville: 'Al Hoceima' },
  });
  
  const ttu = await prisma.airport.upsert({
    where: { codeIata: 'TTU' },
    update: { codeOaci: 'GMTN' },
    create: { codeIata: 'TTU', codeOaci: 'GMTN', nom: 'Tétouan - Sania Ramel', ville: 'Tétouan' },
  });
  
  const gln = await prisma.airport.upsert({
    where: { codeIata: 'GLN' },
    update: { codeOaci: 'GMAG' },
    create: { codeIata: 'GLN', codeOaci: 'GMAG', nom: 'Guelmim', ville: 'Guelmim' },
  });
  
  const vil = await prisma.airport.upsert({
    where: { codeIata: 'VIL' },
    update: { codeOaci: 'GMMH' },
    create: { codeIata: 'VIL', codeOaci: 'GMMH', nom: 'Dakhla', ville: 'Dakhla' },
  });
  
  const eun = await prisma.airport.upsert({
    where: { codeIata: 'EUN' },
    update: { codeOaci: 'GMML' },
    create: { codeIata: 'EUN', codeOaci: 'GMML', nom: 'Laâyoune - Hassan Ier', ville: 'Laâyoune' },
  });
  
  const esu = await prisma.airport.upsert({
    where: { codeIata: 'ESU' },
    update: { codeOaci: 'GMMI' },
    create: { codeIata: 'ESU', codeOaci: 'GMMI', nom: 'Essaouira - Mogador', ville: 'Essaouira' },
  });
  
  const ozz = await prisma.airport.upsert({
    where: { codeIata: 'OZZ' },
    update: { codeOaci: 'GMMZ' },
    create: { codeIata: 'OZZ', codeOaci: 'GMMZ', nom: 'Ouarzazate', ville: 'Ouarzazate' },
  });
  
  const erh = await prisma.airport.upsert({
    where: { codeIata: 'ERH' },
    update: { codeOaci: 'GMFK' },
    create: { codeIata: 'ERH', codeOaci: 'GMFK', nom: 'Errachidia - Moulay Ali Cherif', ville: 'Errachidia' },
  });
  
  const tta = await prisma.airport.upsert({
    where: { codeIata: 'TTA' },
    update: { codeOaci: 'GMAT' },
    create: { codeIata: 'TTA', codeOaci: 'GMAT', nom: 'Tan-Tan - Plage Blanche', ville: 'Tan-Tan' },
  });
  
  const bem = await prisma.airport.upsert({
    where: { codeIata: 'BEM' },
    update: { codeOaci: 'GMMD' },
    create: { codeIata: 'BEM', codeOaci: 'GMMD', nom: 'Béni Mellal', ville: 'Béni Mellal' },
  });
  
  const ozg = await prisma.airport.upsert({
    where: { codeIata: 'OZG' },
    update: { codeOaci: 'GMAZ' },
    create: { codeIata: 'OZG', codeOaci: 'GMAZ', nom: 'Zagora', ville: 'Zagora' },
  });
  
  const uar = await prisma.airport.upsert({
    where: { codeIata: 'UAR' },
    update: { codeOaci: 'GMFB' },
    create: { codeIata: 'UAR', codeOaci: 'GMFB', nom: 'Bouarfa', ville: 'Bouarfa' },
  });
  
  const ifr = await prisma.airport.upsert({
    where: { codeIata: 'IFR' },
    update: { codeOaci: 'GMFI' },
    create: { codeIata: 'IFR', codeOaci: 'GMFI', nom: 'Ifrane', ville: 'Ifrane' },
  });
  
  const ben = await prisma.airport.upsert({
    where: { codeIata: 'BEN' },
    update: { codeOaci: 'GMMB' },
    create: { codeIata: 'BEN', codeOaci: 'GMMB', nom: 'Ben Slimane', ville: 'Ben Slimane' },
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
    where: { email: 'a.ourti@onda.ma' },
    update: {},
    create: {
      email: 'a.ourti@onda.ma',
      passwordHash: passwordAdmin,
      nom: 'Ourti',
      prenom: 'A.',
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

  // Comptes de l'aéroport de Guelmim (GLN). Le `update: {}` est volontaire,
  // comme pour les comptes CMN : le seed est rejoué à chaque démarrage du
  // backend (voir le script "start"), il ne doit donc jamais écraser un mot
  // de passe qui aurait été changé en base après coup.
  await prisma.user.upsert({
    where: { email: 'sup.gln@onda.ma' },
    update: {},
    create: {
      email: 'sup.gln@onda.ma',
      passwordHash: passwordSup,
      nom: 'Superviseur',
      prenom: 'GLN',
      role: 'SUPERVISEUR',
      airportId: gln.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'tech.gln@onda.ma' },
    update: {},
    create: {
      email: 'tech.gln@onda.ma',
      passwordHash: passwordTech,
      nom: 'Technicien',
      prenom: 'GLN',
      role: 'TECHNICIEN',
      airportId: gln.id,
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