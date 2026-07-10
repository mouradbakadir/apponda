import { z } from 'zod';

export const createEquipementSchema = z.object({
  marcheId: z.string().uuid(),
  societeId: z.string().uuid(),
  codeEquipement: z.string().min(1),
  designation: z.string().min(1),
  categorie: z.enum(['ELECTRIQUE', 'MECANIQUE', 'CVC', 'INCENDIE', 'BALISAGE', 'PASSERELLE', 'ASCENSEUR', 'AUTRE']),
  localisation: z.string().min(1),
  criticite: z.enum(['CRITIQUE', 'IMPORTANT', 'STANDARD']).optional(),
  dateMiseEnService: z.string().date().optional(),
  heuresFonctionnementJour: z.number().min(0).max(24).optional(),
});

export const updateEquipementSchema = createEquipementSchema.partial();