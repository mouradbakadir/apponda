import { z } from 'zod';

export const sloConfigSchema = z.object({
  societeId: z.string().uuid(),
  seuilPrr: z.number().min(0).max(100),
  coefPrr: z.number().min(0),
  seuilMrtHeures: z.number().positive(),
  coefMrt: z.number().min(0),
  seuilDispo: z.number().min(0).max(100),
  coefDispo: z.number().min(0),
}).refine((data) => data.coefPrr + data.coefMrt + data.coefDispo > 0, {
  message: 'La somme des coefficients doit être supérieure à 0',
  path: ['coefPrr'],
});

export const sloAnalysisQuerySchema = z.object({
  marcheId: z.string().uuid(),
  societeId: z.string().uuid(),
  period: z.string().default('all'),
  year: z.coerce.number().int().min(2000).max(2100),
});