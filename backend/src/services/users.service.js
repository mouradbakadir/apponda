import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../utils/paginate.js';
import bcrypt from 'bcryptjs';

export async function getAll(tenantFilter, query = {}) {
    const { page = 1, limit = 10, role, search } = query;
    const where = { ...tenantFilter, deletedAt: null };
    if (role) where.role = role;
    
    return paginate(prisma.user, { 
      where, 
      select: { id: true, email: true, nom: true, prenom: true, role: true, airportId: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' } 
    }, page, limit);
  }

export async function getById(id, tenantFilter) {
  const user = await prisma.user.findFirst({
    where: { id, ...tenantFilter, deletedAt: null },
    select: { id: true, email: true, nom: true, prenom: true, role: true, airportId: true, isActive: true, createdAt: true }
  });
  if (!user) throw new AppError(404, 'Utilisateur introuvable', 'NOT_FOUND');
  return user;
}

export async function create(data) {
  // Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new AppError(409, 'Cet email est déjà utilisé', 'EMAIL_ALREADY_EXISTS');

  // Hasher le mot de passe
  const passwordHash = await bcrypt.hash(data.password, 10);
  const { password, ...userData } = data;

  return prisma.user.create({
    data: { ...userData, passwordHash },
    select: { id: true, email: true, role: true }
  });
}

export async function update(id, data, tenantFilter) {
  await getById(id, tenantFilter); // Vérifie que l'user existe
  
  // Si on met à jour le mot de passe, on le hash
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }

  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, role: true, isActive: true }
  });
}

export async function remove(id, tenantFilter) {
  await getById(id, tenantFilter);
  // Soft Delete : on ne supprime pas la ligne, on marque la date de suppression
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false }
  });
}