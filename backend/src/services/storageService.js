import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

// Dossier racine de stockage : "storage" à la racine du backend (déjà créé
// avec les bonnes permissions par le Dockerfile). Configurable via
// STORAGE_PATH si besoin (ex: pour pointer vers un volume monté ailleurs).
const STORAGE_ROOT = path.resolve(process.env.STORAGE_PATH || 'storage');

/**
 * Construit le chemin absolu du dossier de stockage d'un aéroport,
 * et le crée s'il n'existe pas encore (isolation multi-tenant : chaque
 * aéroport a son propre sous-dossier, jamais de mélange).
 */
async function ensureAirportDir(airportId) {
  const dir = path.join(STORAGE_ROOT, airportId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Sauvegarde un fichier (buffer en mémoire, venant de multer) sur le disque.
 *
 * @param {Object} params
 * @param {Buffer} params.buffer - Contenu du fichier (multer memoryStorage)
 * @param {string} params.originalName - Nom d'origine du fichier (pour l'affichage)
 * @param {string} params.airportId - Aéroport propriétaire (isolation tenant)
 * @returns {Promise<{fileName: string, fullPath: string, sizeBytes: number}>}
 */
export async function saveFile({ buffer, originalName, airportId }) {
  if (!airportId) {
    throw new AppError(400, "airportId manquant : impossible de stocker un fichier sans savoir à quel aéroport il appartient", 'MISSING_AIRPORT_ID');
  }

  const dir = await ensureAirportDir(airportId);

  // Nom de fichier physique unique et sûr : on ne garde JAMAIS le nom
  // d'origine tel quel comme nom de fichier sur disque (évite les collisions
  // et les caractères dangereux / path traversal). Le nom d'origine reste
  // stocké séparément en base (originalName) pour l'affichage à l'utilisateur.
  const ext = path.extname(originalName).toLowerCase() || '.pdf';
  const fileName = `${randomUUID()}${ext}`;
  const fullPath = path.join(dir, fileName);

  await fs.writeFile(fullPath, buffer);
  logger.info(`📁 Fichier stocké : ${fullPath} (${buffer.length} octets)`);

  return { fileName, fullPath, sizeBytes: buffer.length };
}

/**
 * Reconstruit le chemin absolu d'un fichier déjà stocké, à partir de son
 * nom de fichier physique et de l'aéroport propriétaire.
 * Toujours passer par cette fonction plutôt que de concaténer les chemins
 * ailleurs dans le code, pour garder un seul point de vérité.
 */
export function getFilePath(fileName, airportId) {
  return path.join(STORAGE_ROOT, airportId, fileName);
}

/**
 * Lit un fichier stocké et retourne son contenu en buffer
 * (utilisé par le worker d'extraction pour lire le PDF).
 */
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

/**
 * Supprime un fichier stocké (ex: en cas d'échec de traitement, ou de
 * suppression d'un document par un utilisateur). Ne lève pas d'erreur si le
 * fichier est déjà absent (idempotent).
 */
export async function deleteFile(fileName, airportId) {
  const fullPath = getFilePath(fileName, airportId);
  try {
    await fs.unlink(fullPath);
    logger.info(`🗑️ Fichier supprimé : ${fullPath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}