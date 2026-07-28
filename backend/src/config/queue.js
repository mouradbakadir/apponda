import { Queue } from 'bullmq';
import { redis } from './redis.js';

// On crée une file d'attente appelée "reports-queue" en lui passant notre connexion Redis
export const reportsQueue = new Queue('reports-queue', { connection: redis });

// File d'attente dédiée à l'extraction IA des PDF de marché (Phase 3).
// defaultJobOptions s'applique à TOUS les jobs ajoutés à cette queue, sauf
// si on les surcharge explicitement au moment de l'ajout (voir Étape E) :
//   - attempts: 3 -> un échec transitoire (ex: Ollama pas encore chargé en
//     mémoire, timeout réseau) ne doit pas être un échec définitif
//   - backoff exponentiel -> on ne retente pas immédiatement (ça ne
//     laisserait pas le temps au problème transitoire de se résoudre),
//     on attend 5s, puis 10s, puis 20s entre chaque tentative
//   - removeOnComplete/removeOnFail -> on garde un historique limité dans
//     Redis plutôt que de le laisser grossir indéfiniment
export const extractionQueue = new Queue('extraction-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 }, // on garde plus d'échecs pour pouvoir déboguer
  },
});