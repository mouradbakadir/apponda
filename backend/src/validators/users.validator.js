import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caracteres'),
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prenom est requis'),
  role: z.enum(['SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN']),
  airportId: z.string().uuid('ID aeroport invalide').optional().nullable(),
});

// Le schema de mise a jour reprend les champs de creation (tous optionnels),
// et ajoute isActive : un champ qui n'a de sens qu'en modification
// (activation/desactivation d'un compte existant), jamais a la creation.
export const updateUserSchema = createUserSchema.partial().extend({
  isActive: z.boolean().optional(),
});