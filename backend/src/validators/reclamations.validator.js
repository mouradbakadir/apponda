import { z } from 'zod';

export const createReclamationSchema = z.object({
  panneId: z.string().uuid(),
  tNotification: z.string().datetime(),
  moyenNotification: z.enum(['APPEL', 'EMAIL', 'SMS', 'APPLICATION']).optional().default('APPLICATION'),
  tArrivee: z.string().datetime().optional(),
  objet: z.string().optional(),
  statut: z.enum(['NOUVELLE', 'EN_COURS', 'RESOLUE']).optional(),
  commentaire: z.string().optional(),
});

export const updateReclamationSchema = createReclamationSchema.partial();