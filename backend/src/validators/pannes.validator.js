import { z } from 'zod';

export const createPanneSchema = z.object({
  equipementId: z.string().uuid(),
  tPanne: z.string().datetime(),
  tReprise: z.string().datetime().optional(),
  causePanne: z.enum(['USURE', 'DEFAUT_ELECTRIQUE', 'DEFAUT_MECANIQUE', 'FACTEUR_EXTERNE', 'INCONNU']),
  description: z.string().min(1),
  actionsCorrectives: z.string().optional(),
  impact: z.enum(['CRITIQUE', 'MAJEUR', 'MINEUR']),
});

export const closePanneSchema = z.object({
  tReprise: z.string().datetime(),
  actionsCorrectives: z.string().optional(),
});