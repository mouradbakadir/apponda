import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../utils/paginate.js';

export async function getAll(tenantFilter, query = {}) {
  const { page = 1, limit = 10, statutValidation } = query;
  const where = { ...tenantFilter, deletedAt: null };
  if (statutValidation) where.statutValidation = statutValidation;

  return paginate(prisma.interventionPreventive, { where, orderBy: { createdAt: 'desc' } }, page, limit);
}

export async function create(data, user) {
  try {
    const tenantFilter = user.role === 'SUPER_ADMIN' ? {} : { airportId: user.airportId };
    
    // 1. On cherche l'équipement pour récupérer son airportId
    const equipement = await prisma.equipement.findFirst({
      where: { id: data.equipementId, ...tenantFilter, deletedAt: null }
    });
    if (!equipement) throw new AppError(400, 'Équipement invalide', 'INVALID_REFERENCE');

    return await prisma.interventionPreventive.create({
      data: {
        ...data,
        mois: new Date(data.mois),
        // CORRECTION: On utilise l'airportId de l'équipement
        airportId: equipement.airportId,
        saisiParId: user.id,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new AppError(409, 'Une saisie existe déjà pour cet équipement ce mois-ci', 'DUPLICATE_ENTRY');
    }
    throw err;
  }
}

export async function validate(id, valide, validateurId, tenantFilter) {
  const record = await prisma.interventionPreventive.findFirst({ where: { id, ...tenantFilter, deletedAt: null } });
  if (!record) throw new AppError(404, 'Saisie introuvable', 'NOT_FOUND');
  return prisma.interventionPreventive.update({
    where: { id },
    data: { statutValidation: valide ? 'VALIDE' : 'REJETE', valideParId: validateurId },
  });
}

export async function getById(id, tenantFilter) {
  const prev = await prisma.interventionPreventive.findFirst({ where: { id, ...tenantFilter, deletedAt: null } });
  if (!prev) throw new AppError(404, 'Intervention préventive introuvable', 'NOT_FOUND');
  return prev;
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);
  return prisma.interventionPreventive.update({ where: { id }, data: { deletedAt: new Date() } });
}