import { prisma } from '../config/prisma.js';

export async function getAll(user) {
  if (user.role === 'SUPER_ADMIN') {
    // Vue nationale : tous les aeroports actifs
    return prisma.airport.findMany({ where: { statut: 'ACTIF' }, orderBy: { nom: 'asc' } });
  }
  // SUPERVISEUR/TECHNICIEN : uniquement leur propre aeroport
  return prisma.airport.findMany({ where: { id: user.airportId } });
}