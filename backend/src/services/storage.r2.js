import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

/**
 * Driver de stockage sur Cloudflare R2.
 *
 * R2 expose une API compatible S3 : on utilise donc le client S3 d'AWS, avec
 * un endpoint personnalisé. La région doit valoir "auto" -- R2 n'a pas de
 * régions au sens d'AWS, et toute autre valeur fait échouer la signature.
 *
 * Ce driver existe parce que le disque d'un conteneur Railway est éphémère :
 * sans stockage externe, tous les PDF déposés disparaissent au redéploiement
 * suivant. Aucun changement de schéma n'a été nécessaire : la clé de l'objet
 * est reconstruite à partir de airportId et fileName, deux valeurs déjà
 * présentes en base.
 */
// Le client est construit à la première utilisation, pas au chargement du
// module : storageService.js importe les deux drivers, et instancier un
// client S3 sans identifiants (cas d'une installation locale sans R2) n'a
// aucun sens. La configuration est de toute façon validée au démarrage par
// config/env.js quand STORAGE_DRIVER vaut "r2".
let client = null;

function getClient() {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: env.storage.r2.endpoint,
      credentials: {
        accessKeyId: env.storage.r2.accessKeyId,
        secretAccessKey: env.storage.r2.secretAccessKey,
      },
      // Style "path" (<endpoint>/<bucket>/<clé>) plutôt que le style
      // virtual-host par défaut du SDK (<bucket>.<endpoint>/<clé>). R2
      // accepte les deux, mais le style path est celui que couvrent les
      // tests : ils visent un serveur local, dont l'hôte est une adresse IP
      // sur laquelle le SDK bascule d'office en path. Le forcer garantit que
      // la production emprunte exactement le chemin de code testé.
      forcePathStyle: true,
    });
  }
  return client;
}

const BUCKET = env.storage.r2.bucket;

/**
 * Clé de l'objet dans le bucket. Le préfixe par aéroport reproduit
 * l'arborescence du driver local et conserve l'isolation multi-tenant :
 * les fichiers d'un aéroport ne se mélangent jamais à ceux d'un autre.
 */
export function getFilePath(fileName, airportId) {
  return `${airportId}/${fileName}`;
}

export async function saveFile({ buffer, fileName, airportId, mimeType }) {
  const key = getFilePath(fileName, airportId);

  await getClient().send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType || 'application/pdf',
  }));

  logger.info(`☁️ Fichier stocké sur R2 : ${key} (${buffer.length} octets)`);

  return { fileName, fullPath: key, sizeBytes: buffer.length };
}

export async function readFile(fileName, airportId) {
  const key = getFilePath(fileName, airportId);
  try {
    const response = await getClient().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    // transformToByteArray() consomme le flux en entier : c'est voulu, les
    // appelants (extraction, téléchargement) ont besoin du buffer complet.
    return Buffer.from(await response.Body.transformToByteArray());
  } catch (err) {
    // R2 renvoie NoSuchKey ; on normalise vers la même AppError que le driver
    // local, pour que les appelants n'aient pas à connaître le driver actif.
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      throw new AppError(404, 'Fichier introuvable sur le stockage', 'FILE_NOT_FOUND');
    }
    throw err;
  }
}

export async function deleteFile(fileName, airportId) {
  const key = getFilePath(fileName, airportId);
  // DeleteObject est idempotent côté S3/R2 : supprimer une clé absente
  // réussit sans erreur, comme le ENOENT ignoré du driver local.
  await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  logger.info(`🗑️ Fichier supprimé de R2 : ${key}`);
}
