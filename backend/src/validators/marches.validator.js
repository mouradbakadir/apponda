import { z } from 'zod';

export const createMarcheSchema = z.object({
  numeroMarche: z.string().min(1),
  objet: z.string().min(1),
  typeMaintenance: z.enum(['PREVENTIVE', 'CORRECTIVE', 'MIXTE']),
  slaDisponibilite: z.number().min(0).max(100),
  slaPrr: z.number().min(0).max(100),
  slaMrt: z.number().int().positive(),
  dateDebut: z.string().datetime().or(z.string().date()),
  dateFin: z.string().datetime().or(z.string().date()),
  montantTotal: z.number().positive().optional(),
  penaliteParInfraction: z.number().positive().optional(),
});

export const updateMarcheSchema = createMarcheSchema.partial();