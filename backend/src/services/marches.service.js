import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

import { paginate } from '../utils/paginate.js';

export async function getAll(tenantFilter, query = {}) {
  const { page = 1, limit = 10, statut } = query;

  const where = { ...tenantFilter, deletedAt: null };

  if (statut) {
    where.statut = statut;
  }

  return paginate(
    prisma.marche,
    { where, orderBy: { createdAt: 'desc' } },
    page,
    limit
  );
}

export async function getById(id, tenantFilter) {
  const marche = await prisma.marche.findFirst({ where: { id, ...tenantFilter, deletedAt: null } });
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

  // Conversion obligatoire : Prisma exige un objet Date complet (ou une chaîne
  // ISO-8601 avec heure) pour une colonne @db.Date, jamais une simple chaîne
  // "YYYY-MM-DD" telle qu'envoyée par le formulaire HTML (input type="date").
  if (data.dateDebut) data.dateDebut = new Date(data.dateDebut);
  if (data.dateFin) data.dateFin = new Date(data.dateFin);

  return prisma.marche.update({ where: { id }, data });
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);
  return prisma.marche.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
}