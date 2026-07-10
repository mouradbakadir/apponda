import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

async function ensureInTenant(model, id, tenantFilter, label) {
  const record = await prisma[model].findFirst({ where: { id, ...tenantFilter } });
  if (!record) throw new AppError(400, `${label} invalide pour cet aéroport`, 'INVALID_REFERENCE');
  return record;
}

export async function getAll(tenantFilter) {
  return prisma.equipement.findMany({ where: tenantFilter, orderBy: { createdAt: 'desc' } });
}

export async function getById(id, tenantFilter) {
  const eq = await prisma.equipement.findFirst({ where: { id, ...tenantFilter } });
  if (!eq) throw new AppError(404, 'Équipement introuvable', 'NOT_FOUND');
  return eq;
}

export async function create(data, user) {
  const tenantFilter = user.role === 'SUPER_ADMIN' ? {} : { airportId: user.airportId };
  await ensureInTenant('marche', data.marcheId, tenantFilter, 'Marché');
  await ensureInTenant('societe', data.societeId, tenantFilter, 'Société');
  return prisma.equipement.create({ data: { ...data, airportId: user.airportId } });
}

export async function update(id, data, tenantFilter) {
  await getById(id, tenantFilter);
  return prisma.equipement.update({ where: { id }, data });
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);
  return prisma.equipement.delete({ where: { id } });
}