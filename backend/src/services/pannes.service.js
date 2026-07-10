import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

function computeDureeMinutes(tPanne, tReprise) {
  if (!tReprise) return null;
  const diffMs = new Date(tReprise) - new Date(tPanne);
  if (diffMs < 0) throw new AppError(400, 'La date de reprise ne peut pas précéder la date de panne', 'INVALID_DATES');
  return Math.round(diffMs / 60000);
}

export async function getAll(tenantFilter) {
  return prisma.panne.findMany({ where: tenantFilter, orderBy: { tPanne: 'desc' } });
}

export async function create(data, user) {
  const dureeArretMinutes = computeDureeMinutes(data.tPanne, data.tReprise);
  return prisma.panne.create({
    data: {
      ...data,
      tPanne: new Date(data.tPanne),
      tReprise: data.tReprise ? new Date(data.tReprise) : null,
      dureeArretMinutes,
      statut: data.tReprise ? 'RESOLUE' : 'OUVERTE',
      airportId: user.airportId,
      saisiParId: user.id,
    },
  });
}

export async function close(id, data, tenantFilter) {
  const panne = await prisma.panne.findFirst({ where: { id, ...tenantFilter } });
  if (!panne) throw new AppError(404, 'Panne introuvable', 'NOT_FOUND');
  const dureeArretMinutes = computeDureeMinutes(panne.tPanne, data.tReprise);
  return prisma.panne.update({
    where: { id },
    data: { tReprise: new Date(data.tReprise), dureeArretMinutes, statut: 'RESOLUE', actionsCorrectives: data.actionsCorrectives },
  });
}