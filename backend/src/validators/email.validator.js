import { z } from 'zod';

// Doit matcher EXACTEMENT les valeurs de `emailTypes` dans EmailPanel.jsx
export const generateEmailSchema = z.object({
  type: z.enum(['NOTIF_PANNE', 'NOTIF_PANNE_DET', 'RELANCE_1', 'RELANCE_2', 'NON_CONFORMITE', 'PENALITES', 'MISE_EN_DEMEURE']),
  urgence: z.enum(['NORMAL', 'URGENT', 'CRITIQUE']).default('NORMAL'),
  signataire: z.string().max(150).nullable().optional(),
  fonction: z.string().max(150).nullable().optional(),
  contexteLibre: z.string().max(2000).nullable().optional(),
});

export const sendEmailSchema = z.object({
  destinataire: z.string().email('Adresse email invalide'),
  objet: z.string().min(1, "L'objet ne peut pas être vide").max(255),
  corps: z.string().min(1, 'Le corps ne peut pas être vide'),
});