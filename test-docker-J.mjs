// test-docker-J.mjs -- à exécuter DANS le conteneur, pas en local
import fs from 'fs/promises';
import { extractDocument } from './src/services/extractionService.js';

const buffer = await fs.readFile('./014-24_ASTROPHYSICS.pdf');
const airportContext = { nom: 'Agadir/Al Massira', ville: 'Agadir' };

console.log('Test Docker J : extraction en cours...');
const start = Date.now();
const result = await extractDocument(buffer, [1, 2], airportContext);
console.log(`Durée : ${Math.round((Date.now() - start) / 1000)}s`);
console.log(JSON.stringify(result, null, 2));
console.log(result.extractedJson.numeroMarche ? '✅ Extraction réussie dans le conteneur' : '❌ Échec');