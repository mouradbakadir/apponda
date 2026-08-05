import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  period: z.string().default('all'),
  societeId: z.string().default('all'),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});