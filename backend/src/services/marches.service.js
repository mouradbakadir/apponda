import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

export async function getAll(tenantFilter) {
  return prisma.marche.findMany({ where: tenantFilter, orderBy: { createdAt: 'desc' } });
}

export async function getById(id, tenantFilter) {
  const marche = await prisma.marche.findFirst({ where: { id, ...tenantFilter } });
  if (!marche) throw new AppError(404, 'Marché introuvable', 'NOT_FOUND');
  return marche;
}

export async function create(data, user) {
  if (!user.airportId) {
    throw new AppError(400, "Un SUPER_ADMIN doit préciser un aéroport pour créer un marché", 'MISSING_AIRPORT');
  }
  return prisma.marche.create({
    data: { ...data, airportId: user.airportId, dateDebut: new Date(data.dateDebut), dateFin: new Date(data.dateFin) },
  });
}

export async function update(id, data, tenantFilter) {
  await getById(id, tenantFilter); // vérifie existence + appartenance au tenant
  return prisma.marche.update({ where: { id }, data });
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);
  return prisma.marche.delete({ where: { id } });
}