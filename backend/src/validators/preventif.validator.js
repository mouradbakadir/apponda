import { z } from 'zod';

export const createPreventifSchema = z.object({
  equipementId: z.string().uuid(),
  mois: z.string().date(),
  nbInterventionsPlanifiees: z.number().int().min(0),
  nbInterventionsRealisees: z.number().int().min(0),
  observations: z.string().optional(),
});