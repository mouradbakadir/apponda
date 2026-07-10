import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

function computeTempsReaction(tNotification, tArrivee) {
  if (!tArrivee) return null;
  const diffMs = new Date(tArrivee) - new Date(tNotification);
  if (diffMs < 0) throw new AppError(400, "L'arrivée ne peut pas précéder la notification", 'INVALID_DATES');
  return Math.round(diffMs / 60000);
}

export async function getAll(tenantFilter) {
  return prisma.reclamation.findMany({ where: tenantFilter, orderBy: { createdAt: 'desc' } });
}

export async function create(data, user) {
  const panne = await prisma.panne.findFirst({
    where: { id: data.panneId, ...(user.role === 'SUPER_ADMIN' ? {} : { airportId: user.airportId }) },
    include: { equipement: { include: { marche: true } } },
  });
  if (!panne) throw new AppError(400, 'Panne invalide pour cet aéroport', 'INVALID_PANNE');

  const tempsReactionMinutes = computeTempsReaction(data.tNotification, data.tArrivee);
  const slaMrt = panne.equipement.marche.slaMrt;
  const conformeSla = tempsReactionMinutes !== null ? tempsReactionMinutes <= slaMrt : null;

  return prisma.reclamation.create({
    data: {
      ...data,
      tNotification: new Date(data.tNotification),
      tArrivee: data.tArrivee ? new Date(data.tArrivee) : null,
      tempsReactionMinutes,
      conformeSla,
      airportId: user.airportId,
      saisiParId: user.id,
    },
  });
}