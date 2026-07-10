import { z } from 'zod';

export const createReclamationSchema = z.object({
  panneId: z.string().uuid(),
  tNotification: z.string().datetime(),
  moyenNotification: z.enum(['APPEL', 'EMAIL', 'SMS', 'APPLICATION']),
  tArrivee: z.string().datetime().optional(),
  commentaire: z.string().optional(),
});