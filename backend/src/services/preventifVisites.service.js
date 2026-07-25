import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../utils/paginate.js';

async function ensureSocieteInTenant(societeId, tenantFilter) {
  const societe = await prisma.societe.findFirst({ where: { id: societeId, ...tenantFilter, deletedAt: null } });
  if (!societe) throw new AppError(400, 'Société invalide pour cet aéroport', 'INVALID_REFERENCE');
  return societe;
}

export async function getAll(tenantFilter, query = {}) {
  const { page = 1, limit = 50 } = query;
  return paginate(
    prisma.preventifVisite,
    { where: { ...tenantFilter, deletedAt: null }, orderBy: { datePlanifiee: 'desc' } },
    page,
    limit
  );
}

export async function getById(id, tenantFilter) {
  const visite = await prisma.preventifVisite.findFirst({ where: { id, ...tenantFilter, deletedAt: null } });
  if (!visite) throw new AppError(404, 'Intervention introuvable', 'NOT_FOUND');
  return visite;
}

export async function create(data, user) {
  const tenantFilter = user.role === 'SUPER_ADMIN' ? {} : { airportId: user.airportId };
  const societe = await ensureSocieteInTenant(data.societeId, tenantFilter);

  return prisma.preventifVisite.create({
    data: {
      ...data,
      datePlanifiee: new Date(data.datePlanifiee),
      dateRealisee: data.dateRealisee ? new Date(data.dateRealisee) : null,
      airportId: societe.airportId,
      saisiParId: user.id,
    },
  });
}

export async function update(id, data, tenantFilter) {
  await getById(id, tenantFilter);
  if (data.societeId) await ensureSocieteInTenant(data.societeId, tenantFilter);

  const payload = { ...data };
  if (payload.datePlanifiee) payload.datePlanifiee = new Date(payload.datePlanifiee);
  if (payload.dateRealisee) payload.dateRealisee = new Date(payload.dateRealisee);

  return prisma.preventifVisite.update({ where: { id }, data: payload });
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);
  return prisma.preventifVisite.update({ where: { id }, data: { deletedAt: new Date() } });
}