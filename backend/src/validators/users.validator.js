import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères'),
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  role: z.enum(['SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN']),
  airportId: z.string().uuid('ID aéroport invalide').optional().nullable(),
});

// Le schéma de mise à jour rend tous les champs optionnels
export const updateUserSchema = createUserSchema.partial();