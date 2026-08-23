import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { saveFile, deleteFile, readFile } from './storageService.js';
import { computeDefaultSelectedPages } from './pdfAnalysisService.js';
import { extractionQueue } from '../config/queue.js';
import { resolveAirportId } from './marches.service.js';
import { logger } from '../utils/logger.js';

/**
 * Détermine l'aéroport propriétaire du futur MarcheDocument.
 *
 * Deux cas, en écho direct à la discussion sur les marchés "Lot" :
 *  - `marcheId` fourni (CAS 2 : ajout d'un PDF après coup) -> l'aéroport
 *    est TOUJOURS celui du marché existant, jamais reposé sur l'utilisateur.
 *    Ça vaut aussi pour un marché "Lot" : chaque ligne Marche a son propre
 *    airportId, donc uploader sur la ligne Marche de Guelmime utilise
 *    l'airportId de Guelmime, même si c'est le même PDF que celui déjà
 *    utilisé pour Agadir.
 *  - `marcheId` absent (CAS 1 : le marché n'existe pas encore) -> on
 *    réutilise exactement la même règle que pour la création d'un marché
 *    (resolveAirportId), pour ne jamais dupliquer la logique de sécurité.
 */
async function resolveDocumentAirportId({ marcheId, airportId }, user, tenantFilter) {
  if (marcheId) {
    const marche = await prisma.marche.findFirst({ where: { id: marcheId, ...tenantFilter, deletedAt: null } });
    if (!marche) throw new AppError(400, 'Marché invalide pour cet aéroport', 'INVALID_REFERENCE');
    return { airportId: marche.airportId, marche };
  }
  const resolvedAirportId = await resolveAirportId({ airportId }, user);
  return { airportId: resolvedAirportId, marche: null };
}

/**
 * Un marché ne porte qu'UN document courant : déposer un nouveau PDF
 * remplace le précédent. Cette fonction supprime tous les documents du
 * marché sauf celui qu'on vient d'y rattacher, fichier de stockage compris.
 *
 * Elle est appelée depuis les DEUX chemins qui rattachent un document à un
 * marché -- l'upload direct et attachToMarche. Sans cela, rattacher après
 * coup laisserait deux documents sur le même marché, et l'interface, qui
 * n'affiche que le premier, en montrerait un au hasard.
 *
 * La suppression du fichier est tolérante à l'échec : perdre le marché en
 * base parce qu'un objet distant a déjà disparu serait pire que de laisser
 * un fichier orphelin dans le stockage.
 */
async function remplacerDocumentsPrecedents(marcheId, documentCourantId, tenantFilter) {
  const anciens = await prisma.marcheDocument.findMany({
    where: { marcheId, ...tenantFilter, id: { not: documentCourantId } },
  });

  if (anciens.length === 0) return;

  for (const ancien of anciens) {
    await deleteFile(ancien.fileName, ancien.airportId).catch((err) => {
      logger.warn(`⚠️  [marcheDocuments] Échec suppression fichier ${ancien.fileName} lors du remplacement : ${err.message}`);
    });
  }

  await prisma.marcheDocument.deleteMany({
    where: { marcheId, ...tenantFilter, id: { not: documentCourantId } },
  });

  logger.info(`🗑️  [marcheDocuments] ${anciens.length} ancien(s) document(s) remplacé(s) pour le marché ${marcheId}`);
}

/**
 * CAS 1 & CAS 2 : réception d'un PDF, sauvegarde, création de l'enregistrement
 * MarcheDocument (statut EN_ATTENTE), puis mise en file d'attente du job
 * d'extraction. Ne fait AUCUNE extraction elle-même (c'est le rôle du worker,
 * asynchrone -- voir jobs/extraction.worker.js).
 */
export async function uploadDocument({ buffer, originalName, mimeType, marcheId, airportId, selectedPages, autoExtract = true }, user, tenantFilter) {
  const { airportId: resolvedAirportId } = await resolveDocumentAirportId({ marcheId, airportId }, user, tenantFilter);

  const saved = await saveFile({ buffer, originalName, mimeType, airportId: resolvedAirportId });

  const finalSelectedPages = selectedPages && selectedPages.length > 0
    ? selectedPages
    : await computeDefaultSelectedPages(buffer);

  let document;
  try {
    document = await prisma.marcheDocument.create({
      data: {
        airportId: resolvedAirportId,
        marcheId: marcheId || null,
        fileName: saved.fileName,
        originalName,
        mimeType,
        sizeBytes: saved.sizeBytes,
        selectedPages: finalSelectedPages,
        statut: 'EN_ATTENTE',
        uploadedById: user.id,
      },
    });
  } catch (err) {
    await deleteFile(saved.fileName, resolvedAirportId).catch(() => {});
    throw err;
  }

  if (marcheId) {
    await remplacerDocumentsPrecedents(marcheId, document.id, tenantFilter);
  }

  // CHANGEMENT : l'extraction n'est mise en file que si demandée
  // explicitement. Un simple dépôt de fichier (autoExtract: false)
  // sauvegarde le document immédiatement -- l'extraction IA reste une
  // action séparée, déclenchée plus tard par triggerExtraction().
  if (autoExtract) {
    await extractionQueue.add('extract-marche-pdf', { documentId: document.id });
    logger.info(`📤 [marcheDocuments] Document ${document.id} uploadé et mis en file d'extraction (aéroport ${resolvedAirportId})`);
  } else {
    logger.info(`📤 [marcheDocuments] Document ${document.id} uploadé SANS extraction automatique (aéroport ${resolvedAirportId})`);
  }

  return document;
}

/**
 * Récupère le statut courant d'un document (pour le polling frontend).
 * Le filtre tenant s'applique ici comme partout ailleurs : un SUPERVISEUR
 * ne doit jamais pouvoir consulter le document d'un autre aéroport, même
 * en devinant son UUID.
 */
export async function getStatus(id, tenantFilter) {
  const document = await prisma.marcheDocument.findFirst({ where: { id, ...tenantFilter } });
  if (!document) throw new AppError(404, 'Document introuvable', 'NOT_FOUND');
  return document;
}

/**
 * CAS 1 : une fois le marché réellement créé (après validation utilisateur
 * du formulaire pré-rempli), on relie le document déjà uploadé à ce
 * marché -- simple traçabilité, ne modifie aucune donnée du marché.
 */
export async function attachToMarche(documentId, marcheId, tenantFilter) {
  const document = await getStatus(documentId, tenantFilter);
  const marche = await prisma.marche.findFirst({ where: { id: marcheId, ...tenantFilter, deletedAt: null } });
  if (!marche) throw new AppError(400, 'Marché invalide pour cet aéroport', 'INVALID_REFERENCE');

  const rattache = await prisma.marcheDocument.update({ where: { id: document.id }, data: { marcheId } });

  // Même invariant que pour l'upload direct : un seul document courant par
  // marché. Sans cette ligne, modifier un marché en y déposant un PDF
  // laissait l'ancien document en place à côté du nouveau.
  await remplacerDocumentsPrecedents(marcheId, rattache.id, tenantFilter);

  return rattache;
}

// Champs comparés à l'écran (CAS 2). `statut` est volontairement absent :
// ce n'est jamais une donnée extraite du PDF (voir l'analyse des champs
// extractibles -- statut est un état de cycle de vie applicatif).
const COMPARABLE_FIELDS = [
  'numeroMarche', 'objet', 'typeMaintenance',
  'slaDisponibilite', 'slaPrr', 'slaMrt',
  'dateDebut', 'dateFin', 'montantTotal', 'penaliteParInfraction',
];

function normalizeForCompare(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  // Decimal Prisma -> toString() pour comparer proprement à un number JS
  if (typeof value === 'object' && typeof value.toString === 'function') {
    const asString = value.toString();
    const asNumber = Number(asString);
    return Number.isNaN(asNumber) ? asString : asNumber;
  }
  return value;
}

/**
 * CAS 2 : construit le diff champ par champ entre les valeurs actuelles du
 * marché et celles extraites du PDF. Ne modifie RIEN en base -- lecture
 * seule, purement informative pour alimenter l'écran de comparaison décrit
 * dans la demande initiale.
 */
export async function compareWithMarche(documentId, tenantFilter) {
  const document = await getStatus(documentId, tenantFilter);

  if (document.statut !== 'EXTRAIT') {
    throw new AppError(409, `L'extraction n'est pas encore terminée (statut actuel : ${document.statut})`, 'EXTRACTION_NOT_READY');
  }
  if (!document.marcheId) {
    throw new AppError(409, "Ce document n'est rattaché à aucun marché : rien à comparer (utilisez le pré-remplissage du formulaire de création à la place)", 'NO_MARCHE_TO_COMPARE');
  }

  const marche = await prisma.marche.findFirst({ where: { id: document.marcheId, ...tenantFilter, deletedAt: null } });
  if (!marche) throw new AppError(404, 'Marché introuvable', 'NOT_FOUND');

  const extracted = document.extractedJson || {};

  const comparaison = COMPARABLE_FIELDS.map((champ) => {
    const valeurActuelle = normalizeForCompare(marche[champ]);
    const valeurExtraite = normalizeForCompare(extracted[champ]);
    const identique = valeurExtraite === null || valeurActuelle === valeurExtraite;

    return {
      champ,
      valeurActuelle,
      valeurExtraite,
      // "aucune proposition" : soit le PDF n'a rien trouvé pour ce champ,
      // soit la valeur extraite est strictement identique à l'actuelle --
      // dans les deux cas, rien à demander à l'utilisateur pour ce champ.
      propositionDisponible: !identique,
    };
  });

  return {
    documentId: document.id,
    marcheId: marche.id,
    confidenceScore: document.confidenceScore,
    comparaison,
  };
}

/**
 * CAS 2 : applique UNIQUEMENT les champs explicitement choisis par
 * l'utilisateur (liste blanche déjà imposée par confirmDocumentSchema).
 * Ne touche jamais `statut`, ne fait jamais un update "tout ou rien" à
 * partir d'extractedJson.
 */
export async function confirmMerge(documentId, champs, tenantFilter) {
  const document = await getStatus(documentId, tenantFilter);
  if (!document.marcheId) {
    throw new AppError(409, 'Ce document n\'est rattaché à aucun marché', 'NO_MARCHE_TO_COMPARE');
  }

  const marche = await prisma.marche.findFirst({ where: { id: document.marcheId, ...tenantFilter, deletedAt: null } });
  if (!marche) throw new AppError(404, 'Marché introuvable', 'NOT_FOUND');

  const data = { ...champs };
  if (data.dateDebut) data.dateDebut = new Date(data.dateDebut);
  if (data.dateFin) data.dateFin = new Date(data.dateFin);

  return prisma.marche.update({ where: { id: marche.id }, data });
}
export async function downloadDocument(id, tenantFilter) {
  const document = await getStatus(id, tenantFilter);
  const buffer = await readFile(document.fileName, document.airportId);
  return { buffer, originalName: document.originalName, mimeType: document.mimeType };
}
/**
 * Déclenche l'extraction IA sur un document déjà uploadé (sans extraction
 * automatique à l'origine, ou pour relancer après un échec). Sépare
 * clairement "sauvegarder le fichier" de "lancer l'IA dessus" -- l'un est
 * automatique et immédiat, l'autre reste une action explicite de
 * l'utilisateur.
 */
export async function triggerExtraction(documentId, tenantFilter) {
  const document = await getStatus(documentId, tenantFilter);

  if (document.statut === 'EN_COURS' || document.statut === 'EXTRAIT') {
    return document; // déjà en cours ou déjà fait, rien à refaire
  }

  await prisma.marcheDocument.update({ where: { id: document.id }, data: { statut: 'EN_ATTENTE' } });
  await extractionQueue.add('extract-marche-pdf', { documentId: document.id });
  logger.info(` [marcheDocuments] Extraction déclenchée manuellement pour le document ${document.id}`);

  return prisma.marcheDocument.findUnique({ where: { id: document.id } });
}