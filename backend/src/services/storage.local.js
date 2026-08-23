import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

/**
 * Driver de stockage sur le disque local du conteneur.
 *
 * C'est le driver historique, conservé pour le développement (docker-compose
 * monte un volume partagé entre l'API et le worker). En production sur
 * Railway, préférer le driver R2 : le disque d'un conteneur est éphémère et
 * repart vide à chaque redéploiement.
 */
const STORAGE_ROOT = path.resolve(env.storage.localPath);

async function ensureAirportDir(airportId) {
  const dir = path.join(STORAGE_ROOT, airportId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function getFilePath(fileName, airportId) {
  return path.join(STORAGE_ROOT, airportId, fileName);
}

export async function saveFile({ buffer, fileName, airportId }) {
  const dir = await ensureAirportDir(airportId);
  const fullPath = path.join(dir, fileName);

  await fs.writeFile(fullPath, buffer);
  logger.info(`📁 Fichier stocké : ${fullPath} (${buffer.length} octets)`);

  return { fileName, fullPath, sizeBytes: buffer.length };
}

export async function readFile(fileName, airportId) {
  const fullPath = getFilePath(fileName, airportId);
  try {
    return await fs.readFile(fullPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new AppError(404, 'Fichier introuvable sur le disque', 'FILE_NOT_FOUND');
    }
    throw err;
  }
}

export async function deleteFile(fileName, airportId) {
  const fullPath = getFilePath(fileName, airportId);
  try {
    await fs.unlink(fullPath);
    logger.info(`🗑️ Fichier supprimé : ${fullPath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}
