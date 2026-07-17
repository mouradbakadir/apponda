import { Queue } from 'bullmq';
import { redis } from './redis.js';

// On crée une file d'attente appelée "reports-queue" en lui passant notre connexion Redis
export const reportsQueue = new Queue('reports-queue', { connection: redis });