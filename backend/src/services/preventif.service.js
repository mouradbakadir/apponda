import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

export async function getAll(tenantFilter) {
  return prisma.interventionPreventive.findMany({ where: tenantFilter, orderBy: { mois: 'desc' } });
}

export async function create(data, user) {
  try {
    return await prisma.interventionPreventive.create({
      data: {
        ...data,
        mois: new Date(data.mois),
        airportId: user.airportId,
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
  const record = await prisma.interventionPreventive.findFirst({ where: { id, ...tenantFilter } });
  if (!record) throw new AppError(404, 'Saisie introuvable', 'NOT_FOUND');
  return prisma.interventionPreventive.update({
    where: { id },
    data: { statutValidation: valide ? 'VALIDE' : 'REJETE', valideParId: validateurId },
  });
}