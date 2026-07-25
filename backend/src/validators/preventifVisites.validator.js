import { z } from 'zod';

export const createVisiteSchema = z.object({
  societeId: z.string().uuid(),
  titre: z.string().min(1),
  datePlanifiee: z.string().date(),
  dateRealisee: z.string().date().optional(),
  statut: z.enum(['PLANIFIEE', 'REALISEE', 'ANNULEE']).optional(),
  observations: z.string().optional(),
});

export const updateVisiteSchema = createVisiteSchema.partial();