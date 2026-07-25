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
  montantTotal: z.number().positive().nullable().optional(),
  penaliteParInfraction: z.number().positive().nullable().optional(),
}).refine(data => new Date(data.dateDebut) < new Date(data.dateFin), {
  message: "La date de fin doit être strictement supérieure à la date de début",
  path: ["dateFin"]
});

export const updateMarcheSchema = z.object({
  numeroMarche: z.string().min(1).optional(),
  objet: z.string().min(1).optional(),
  typeMaintenance: z.enum(['PREVENTIVE', 'CORRECTIVE', 'MIXTE']).optional(),
  slaDisponibilite: z.number().min(0).max(100).optional(),
  slaPrr: z.number().min(0).max(100).optional(),
  slaMrt: z.number().int().positive().optional(),
  dateDebut: z.string().datetime().or(z.string().date()).optional(),
  dateFin: z.string().datetime().or(z.string().date()).optional()
}).refine(data => {
  if (data.dateDebut && data.dateFin) {
    return new Date(data.dateDebut) < new Date(data.dateFin);
  }
  return true;
}, {
  message: "La date de fin doit être strictement supérieure à la date de début",
  path: ["dateFin"]
});