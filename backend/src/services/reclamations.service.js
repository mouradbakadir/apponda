import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../utils/paginate.js';

function computeTempsReaction(tNotification, tArrivee) {
  if (!tArrivee) return null;
  const diffMs = new Date(tArrivee) - new Date(tNotification);
  if (diffMs < 0) throw new AppError(400, "L'arrivée ne peut pas précéder la notification", 'INVALID_DATES');
  return Math.round(diffMs / 60000);
}

export async function getAll(tenantFilter, query = {}) {
  const { page = 1, limit = 10, conformeSla } = query;
  const where = { ...tenantFilter, deletedAt: null };
  if (conformeSla !== undefined) where.conformeSla = conformeSla === 'true';

  return paginate(prisma.reclamation, { where, orderBy: { createdAt: 'desc' } }, page, limit);
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
      airportId: panne.airportId,
      saisiParId: user.id,
    },
  });
}

export async function getById(id, tenantFilter) {
  const rec = await prisma.reclamation.findFirst({ where: { id, ...tenantFilter, deletedAt: null } });
  if (!rec) throw new AppError(404, 'Réclamation introuvable', 'NOT_FOUND');
  return rec;
}

export async function update(id, data, tenantFilter) {
  const existing = await getById(id, tenantFilter);
  const payload = { ...data };

  const nextTNotification = payload.tNotification ? new Date(payload.tNotification) : existing.tNotification;
  const nextTArrivee = payload.tArrivee !== undefined
    ? (payload.tArrivee ? new Date(payload.tArrivee) : null)
    : existing.tArrivee;

  if (payload.tNotification) payload.tNotification = nextTNotification;
  if (payload.tArrivee !== undefined) payload.tArrivee = nextTArrivee;

  // Recalcule automatiquement le temps de reaction / la conformite SLA
  // si l'une des deux dates a change.
  if (payload.tNotification || payload.tArrivee !== undefined) {
    const tempsReactionMinutes = computeTempsReaction(nextTNotification, nextTArrivee);
    payload.tempsReactionMinutes = tempsReactionMinutes;
    if (tempsReactionMinutes !== null) {
      const panne = await prisma.panne.findUnique({
        where: { id: existing.panneId },
        include: { equipement: { include: { marche: true } } },
      });
      payload.conformeSla = tempsReactionMinutes <= panne.equipement.marche.slaMrt;
    } else {
      payload.conformeSla = null;
    }
  }

  return prisma.reclamation.update({ where: { id }, data: payload });
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);
  return prisma.reclamation.update({ where: { id }, data: { deletedAt: new Date() } });
}