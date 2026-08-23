import path from 'path';
import { randomUUID } from 'crypto';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import * as localDriver from './storage.local.js';
import * as r2Driver from './storage.r2.js';

/**
 * Façade de stockage des fichiers.
 *
 * Deux implémentations existent derrière cette interface :
 *  - "local" : disque du conteneur (développement, docker-compose) ;
 *  - "r2"    : Cloudflare R2, objet distant et persistant (production).
 *
 * Le driver est choisi une fois au démarrage à partir de STORAGE_DRIVER
 * (voir config/env.js). Aucun appelant ne sait lequel est actif : tous
 * manipulent un couple (fileName, airportId), jamais un chemin ni une clé.
 * C'est ce qui permet de passer du disque à R2 sans migration de la base :
 * la localisation d'un fichier est toujours recalculée à partir de ces deux
 * valeurs, déjà stockées sur chaque MarcheDocument.
 */
const driver = env.storage.driver === 'r2' ? r2Driver : localDriver;

/**
 * Sauvegarde un fichier (buffer en mémoire, venant de multer).
 *
 * @param {Object} params
 * @param {Buffer} params.buffer - Contenu du fichier (multer memoryStorage)
 * @param {string} params.originalName - Nom d'origine du fichier (pour l'affichage)
 * @param {string} params.airportId - Aéroport propriétaire (isolation tenant)
 * @param {string} [params.mimeType] - Type MIME d'origine
 * @returns {Promise<{fileName: string, fullPath: string, sizeBytes: number}>}
 */
export async function saveFile({ buffer, originalName, airportId, mimeType }) {
  if (!airportId) {
    throw new AppError(400, "airportId manquant : impossible de stocker un fichier sans savoir à quel aéroport il appartient", 'MISSING_AIRPORT_ID');
  }

  // Nom de fichier physique unique et sûr : on ne garde JAMAIS le nom
  // d'origine tel quel (évite les collisions et les caractères dangereux /
  // path traversal). Le nom d'origine reste stocké séparément en base
  // (originalName) pour l'affichage à l'utilisateur.
  //
  // Cette génération est volontairement ici, dans la façade, et non dans les
  // drivers : la règle de nommage doit être identique quel que soit le
  // stockage, sans quoi un basculement de driver changerait la forme des
  // clés écrites en base.
  const ext = path.extname(originalName).toLowerCase() || '.pdf';
  const fileName = `${randomUUID()}${ext}`;

  return driver.saveFile({ buffer, fileName, airportId, mimeType });
}

/**
 * Localisation d'un fichier déjà stocké : chemin absolu avec le driver
 * local, clé d'objet avec R2. Toujours passer par cette fonction plutôt
 * que de reconstruire un chemin ailleurs, pour garder un seul point de
 * vérité.
 */
export function getFilePath(fileName, airportId) {
  return driver.getFilePath(fileName, airportId);
}

/**
 * Lit un fichier stocké et retourne son contenu en buffer
 * (utilisé par le worker d'extraction pour lire le PDF).
 * Lève une AppError 404 si le fichier est absent, quel que soit le driver.
 */
export async function readFile(fileName, airportId) {
  return driver.readFile(fileName, airportId);
}

/**
 * Supprime un fichier stocké (ex: en cas d'échec de traitement, ou de
 * suppression d'un document par un utilisateur). Idempotent : ne lève pas
 * d'erreur si le fichier est déjà absent.
 */
export async function deleteFile(fileName, airportId) {
  return driver.deleteFile(fileName, airportId);
}
