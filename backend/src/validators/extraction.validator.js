import { z } from 'zod';

// Version PERMISSIVE de createMarcheSchema (marches.validator.js) : les
// mêmes champs, mais tous nullable/optional -- une extraction IA a le
// droit d'avoir des trous, l'humain corrige à l'Étape G. On ne valide que
// la FORME (types corrects), pas la complétude.
export const extractedMarcheSchema = z.object({
  numeroMarche: z.string().nullable().optional(),
  objet: z.string().nullable().optional(),
  typeMaintenance: z.enum(['PREVENTIVE', 'CORRECTIVE', 'MIXTE']).nullable().optional(),
  slaDisponibilite: z.number().min(0).max(100).nullable().optional(),
  slaPrr: z.number().min(0).max(100).nullable().optional(),
  slaMrt: z.number().int().positive().nullable().optional(),
  dateDebut: z.string().nullable().optional(),
  dateFin: z.string().nullable().optional(),
  montantTotal: z.number().positive().nullable().optional(),
});