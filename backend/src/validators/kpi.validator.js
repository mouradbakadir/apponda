import { z } from 'zod';

export const kpiQuerySchema = z.object({
  dateDebut: z.string().date(),
  dateFin: z.string().date(),
});