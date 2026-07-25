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
  return paginate(
    prisma.societe,
    { where: { ...tenantFilter, deletedAt: null }, orderBy: { createdAt: 'desc' }, include: { membres: true } },
    page,
    limit
  );
}

export async function getById(id, tenantFilter) {
  const societe = await prisma.societe.findFirst({
    where: { id, ...tenantFilter, deletedAt: null },
    include: { membres: true },
  });
  if (!societe) throw new AppError(404, 'Société introuvable', 'NOT_FOUND');
  return societe;
}

export async function create(data, user) {
  const tenantFilter = user.role === 'SUPER_ADMIN' ? {} : { airportId: user.airportId };
  const marche = await ensureMarcheInTenant(data.marcheId, tenantFilter);
  const { membres, ...societeData } = data;

  return prisma.societe.create({
    data: {
      ...societeData,
      airportId: marche.airportId,
      membres: { create: membres || [] },
    },
    include: { membres: true },
  });
}

export async function update(id, data, tenantFilter) {
  await getById(id, tenantFilter);
  if (data.marcheId) await ensureMarcheInTenant(data.marcheId, tenantFilter);
  const { membres, ...societeData } = data;

  // Si une nouvelle liste de membres est fournie, on remplace entierement
  // l'equipe existante (suppression + recreation), dans une transaction
  // atomique pour ne jamais avoir d'etat intermediaire incoherent.
  if (membres !== undefined) {
    const [, updated] = await prisma.$transaction([
      prisma.societeMembre.deleteMany({ where: { societeId: id } }),
      prisma.societe.update({
        where: { id },
        data: { ...societeData, membres: { create: membres } },
        include: { membres: true },
      }),
    ]);
    return updated;
  }

  return prisma.societe.update({ where: { id }, data: societeData, include: { membres: true } });
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);
  return prisma.societe.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}