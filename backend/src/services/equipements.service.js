import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../utils/paginate.js';

async function ensureInTenant(model, id, tenantFilter, label) {
  const record = await prisma[model].findFirst({ where: { id, ...tenantFilter } });
  if (!record) throw new AppError(400, `${label} invalide pour cet aéroport`, 'INVALID_REFERENCE');
  return record;
}

export async function getAll(tenantFilter, query = {}) {
  const { page = 1, limit = 10, statut, categorie } = query;
  const where = { ...tenantFilter, deletedAt: null };
  if (statut) where.statut = statut;
  if (categorie) where.categorie = categorie;

  return paginate(prisma.equipement, { where, orderBy: { createdAt: 'desc' } }, page, limit);
}

export async function getById(id, tenantFilter) {
  const eq = await prisma.equipement.findFirst({ where: { id, ...tenantFilter,   deletedAt: null } });
  if (!eq) throw new AppError(404, 'Équipement introuvable', 'NOT_FOUND');
  return eq;
}

export async function create(data, user) {
  const tenantFilter = user.role === 'SUPER_ADMIN' ? {} : { airportId: user.airportId };
  // On récupère le marché pour en extraire l'airportId correct (même pour un Super Admin)
  const marche = await ensureInTenant('marche', data.marcheId, tenantFilter, 'Marché');
  await ensureInTenant('societe', data.societeId, tenantFilter, 'Société');
  
  if (data.dateMiseEnService) data.dateMiseEnService = new Date(data.dateMiseEnService);
  
  return prisma.equipement.create({ 
    // CORRECTION: On utilise marche.airportId au lieu de user.airportId
    data: { ...data, airportId: marche.airportId } 
  });
}

export async function update(id, data, tenantFilter) {
  await getById(id, tenantFilter);
  if (data.dateMiseEnService) data.dateMiseEnService = new Date(data.dateMiseEnService);
  return prisma.equipement.update({ where: { id }, data });
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);
  return prisma.equipement.update({
  where: { id },
  data: { deletedAt: new Date() }
});
}