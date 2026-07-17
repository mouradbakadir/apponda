import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../utils/paginate.js';

async function ensureMarcheInTenant(marcheId, tenantFilter) {
  const marche = await prisma.marche.findFirst({ where: { id: marcheId, ...tenantFilter } });
  if (!marche) throw new AppError(400, 'Marché invalide pour cet aéroport', 'INVALID_MARCHE');
  return marche;
}

export async function getAll(tenantFilter, query = {}) {
  const { page = 1, limit = 10 } = query;
  return paginate(prisma.societe, { where: { ...tenantFilter, deletedAt: null }, orderBy: { createdAt: 'desc' } }, page, limit);
}

export async function getById(id, tenantFilter) {
  const societe = await prisma.societe.findFirst({ where: { id, ...tenantFilter, deletedAt: null } });
  if (!societe) throw new AppError(404, 'Société introuvable', 'NOT_FOUND');
  return societe;
}

export async function create(data, user) {
  const tenantFilter = user.role === 'SUPER_ADMIN' ? {} : { airportId: user.airportId };
  await ensureMarcheInTenant(data.marcheId, tenantFilter);
  return prisma.societe.create({ data: { ...data, airportId: user.airportId } });
}

export async function update(id, data, tenantFilter) {
  await getById(id, tenantFilter);
  if (data.marcheId) await ensureMarcheInTenant(data.marcheId, tenantFilter);
  return prisma.societe.update({ where: { id }, data });
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);
  return prisma.societe.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
}