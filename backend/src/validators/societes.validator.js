import { z } from 'zod';

export const createSocieteSchema = z.object({
  marcheId: z.string().uuid(),
  raisonSociale: z.string().min(1),
  rcNumber: z.string().min(1),
  ice: z.string().min(1),
  adresse: z.string().min(1),
  telephone: z.string().min(1),
  emailContact: z.string().email(),
  emailNotification: z.string().email(),
  contactUrgenceNom: z.string().min(1),
  contactUrgenceTel: z.string().min(1),
});

export const updateSocieteSchema = createSocieteSchema.partial();