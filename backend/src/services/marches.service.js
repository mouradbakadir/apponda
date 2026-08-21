import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

import { paginate } from '../utils/paginate.js';
import { deleteFile } from './storageService.js';
import { logger } from '../utils/logger.js';

export async function getAll(tenantFilter, query = {}) {
  const { page = 1, limit = 10, statut } = query;

  const where = { ...tenantFilter, deletedAt: null };
  if (statut) where.statut = statut;

  return paginate(
    prisma.marche,
    {
      where,
      orderBy: { createdAt: 'desc' },
      // On ne récupère QUE le document le plus récent par marché, et on
      // exclut ceux en ECHEC (un document raté ne doit jamais s'afficher
      // comme "le" document du marché -- l'utilisateur doit pouvoir
      // réessayer sans être trompé par une carte trompeuse).
      include: {
        documents: {
          where: { statut: { not: 'ECHEC' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, originalName: true, sizeBytes: true, statut: true },
        },
      },
    },
    page,
    limit
  );
}

export async function getById(id, tenantFilter) {
  const marche = await prisma.marche.findFirst({ where: { id, ...tenantFilter, deletedAt: null } });
  if (!marche) throw new AppError(404, 'Marché introuvable', 'NOT_FOUND');
  return marche;
}

/**
 * Détermine l'airportId à utiliser pour créer un marché, selon le rôle.
 *
 * RÈGLE DE SÉCURITÉ (multi-tenant) : on ne fait JAMAIS confiance à un
 * `data.airportId` envoyé par un SUPERVISEUR ou un TECHNICIEN, même s'il
 * n'est pas censé être présent dans le payload (le frontend ne l'affiche
 * pas pour ces rôles -- mais un client HTTP forgé à la main pourrait
 * l'envoyer quand même). Pour ces deux rôles, on écrase systématiquement
 * par `user.airportId`, qui vient du JWT signé côté serveur.
 *
 * Pour un SUPER_ADMIN (qui n'a pas d'airportId propre -- vue nationale),
 * l'aéroport DOIT être fourni explicitement dans `data.airportId`, et on
 * vérifie qu'il correspond à un aéroport réellement existant avant de
 * l'utiliser (sinon Prisma renverrait une erreur P2003 peu explicite pour
 * l'utilisateur final).
 *
 * Exportée : réutilisée telle quelle par marcheDocuments.service.js pour
 * résoudre l'aéroport d'un document uploadé AVANT que son marché n'existe
 * (CAS 1), afin de ne jamais dupliquer cette logique de sécurité.
 */
export async function resolveAirportId(data, user) {
  if (user.role !== 'SUPER_ADMIN') {
    return user.airportId;
  }

  if (!data.airportId) {
    throw new AppError(
      400,
      "En tant que SUPER_ADMIN, vous devez sélectionner l'aéroport concerné par ce marché",
      'MISSING_AIRPORT'
    );
  }

  const airport = await prisma.airport.findUnique({ where: { id: data.airportId } });
  if (!airport) {
    throw new AppError(400, "L'aéroport sélectionné n'existe pas", 'INVALID_AIRPORT');
  }

  return airport.id;
}

export async function create(data, user) {
  const airportId = await resolveAirportId(data, user);

  // On retire airportId du payload avant de le fusionner dans `data` pour
  // le create Prisma : on ne veut JAMAIS que le champ vienne de `...data`
  // (qui peut contenir la valeur non fiable envoyée par un non-admin), on
  // le fixe explicitement à la valeur résolue ci-dessus, en dernier, pour
  // qu'elle ne puisse pas être écrasée par un spread précédent.
  const { airportId: _ignored, ...marcheData } = data;

  return prisma.marche.create({
    data: {
      ...marcheData,
      airportId,
      dateDebut: new Date(data.dateDebut),
      dateFin: new Date(data.dateFin),
    },
  });
}

export async function update(id, data, tenantFilter) {
  await getById(id, tenantFilter); // vérifie existence + appartenance au tenant

  // Conversion obligatoire : Prisma exige un objet Date complet (ou une chaîne
  // ISO-8601 avec heure) pour une colonne @db.Date, jamais une simple chaîne
  // "YYYY-MM-DD" telle qu'envoyée par le formulaire HTML (input type="date").
  if (data.dateDebut) data.dateDebut = new Date(data.dateDebut);
  if (data.dateFin) data.dateFin = new Date(data.dateFin);

  return prisma.marche.update({ where: { id }, data });
}

export async function remove(id, tenantFilter) {
  const marche = await getById(id, tenantFilter); // vérifie existence + appartenance au tenant

  const equipements = await prisma.equipement.findMany({ where: { marcheId: id }, select: { id: true } });
  const equipementIds = equipements.map((e) => e.id);

  const societes = await prisma.societe.findMany({ where: { marcheId: id }, select: { id: true } });
  const societeIds = societes.map((s) => s.id);

  const pannes = await prisma.panne.findMany({ where: { equipementId: { in: equipementIds } }, select: { id: true } });
  const panneIds = pannes.map((p) => p.id);

  // Récupéré AVANT suppression, pour pouvoir nettoyer les fichiers physiques après coup
  const documents = await prisma.marcheDocument.findMany({ where: { marcheId: id } });

  // Suppression en cascade, atomique : soit tout réussit, soit rien n'est modifié
  await prisma.$transaction([
    prisma.reclamation.deleteMany({ where: { panneId: { in: panneIds } } }),
    prisma.panne.deleteMany({ where: { equipementId: { in: equipementIds } } }),
    prisma.interventionPreventive.deleteMany({ where: { equipementId: { in: equipementIds } } }),
    prisma.preventifVisite.deleteMany({ where: { societeId: { in: societeIds } } }),
    prisma.societeMembre.deleteMany({ where: { societeId: { in: societeIds } } }),
    prisma.sloConfig.deleteMany({ where: { marcheId: id } }),
    prisma.equipement.deleteMany({ where: { marcheId: id } }),
    prisma.societe.deleteMany({ where: { marcheId: id } }),
    prisma.marcheDocument.deleteMany({ where: { marcheId: id } }),
    prisma.marche.delete({ where: { id } }),
  ]);

  // Nettoyage des fichiers PDF sur disque -- hors transaction (I/O disque, pas SQL),
  // en best-effort : un échec ici n'annule jamais la suppression déjà confirmée en base.
  for (const doc of documents) {
    await deleteFile(doc.fileName, doc.airportId).catch((err) => {
      logger.warn(`⚠️  [marches] Échec suppression fichier ${doc.fileName} lors de la suppression du marché : ${err.message}`);
    });
  }

  return marche;
}