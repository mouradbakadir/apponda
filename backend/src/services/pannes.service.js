import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../utils/paginate.js';

function computeDureeMinutes(tPanne, tReprise) {
  if (!tReprise) return null;
  const diffMs = new Date(tReprise) - new Date(tPanne);
  if (diffMs < 0) throw new AppError(400, 'La date de reprise ne peut pas précéder la date de panne', 'INVALID_DATES');
  return Math.round(diffMs / 60000);
}

export async function getAll(tenantFilter, query = {}) {
  const { page = 1, limit = 10, statut, impact } = query;
  const where = { ...tenantFilter, deletedAt: null };
  if (statut) where.statut = statut;
  if (impact) where.impact = impact;

  return paginate(prisma.panne, { where, orderBy: { createdAt: 'desc' } }, page, limit);
}

export async function create(data, user) {
  // Pour le SUPER_ADMIN (airportId = null), on récupère l'airportId
  // directement depuis l'équipement concerné par la panne.
  let airportId = user.airportId;
  if (!airportId) {
    const equipement = await prisma.equipement.findUnique({
      where: { id: data.equipementId },
      select: { airportId: true },
    });
    if (!equipement) throw new AppError(404, 'Équipement introuvable', 'NOT_FOUND');
    airportId = equipement.airportId;
  }

  const dureeArretMinutes = computeDureeMinutes(data.tPanne, data.tReprise);
  return prisma.panne.create({
    data: {
      ...data,
      tPanne: new Date(data.tPanne),
      tReprise: data.tReprise ? new Date(data.tReprise) : null,
      dureeArretMinutes,
      statut: data.tReprise ? 'RESOLUE' : 'OUVERTE',
      airportId,
      saisiParId: user.id,
    },
  });
}

export async function close(id, data, tenantFilter) {
  const panne = await prisma.panne.findFirst({ where: { id, ...tenantFilter, deletedAt: null } });
  if (!panne) throw new AppError(404, 'Panne introuvable', 'NOT_FOUND');
  const dureeArretMinutes = computeDureeMinutes(panne.tPanne, data.tReprise);
  return prisma.panne.update({
    where: { id },
    data: { tReprise: new Date(data.tReprise), dureeArretMinutes, statut: 'RESOLUE', actionsCorrectives: data.actionsCorrectives },
  });
}

export async function getById(id, tenantFilter) {
  const panne = await prisma.panne.findFirst({ where: { id, ...tenantFilter, deletedAt: null } });
  if (!panne) throw new AppError(404, 'Panne introuvable', 'NOT_FOUND');
  return panne;
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);
  return prisma.panne.update({ where: { id }, data: { deletedAt: new Date() } });
}