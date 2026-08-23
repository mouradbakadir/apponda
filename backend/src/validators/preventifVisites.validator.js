import { z } from 'zod';

const baseVisiteSchema = z.object({
  societeId: z.string().uuid(),
  titre: z.string().min(1),
  datePlanifiee: z.string().date(),
  datePlanifieeFin: z.string().date().nullable().optional(),
  dateRealisee: z.string().date().optional(),
  dateRealiseeFin: z.string().date().nullable().optional(),
  statut: z.enum(['PLANIFIEE', 'REALISEE', 'ANNULEE']).optional(),
  observations: z.string().optional(),
});

// La date de fin est facultative : elle sert uniquement quand l'intervention
// s'etale sur plusieurs jours. Si elle est fournie, elle doit suivre le debut.
function checkIntervals(data, ctx) {
  if (data.datePlanifieeFin && data.datePlanifiee && data.datePlanifieeFin < data.datePlanifiee) {
    ctx.addIssue({
      code: 'custom',
      path: ['datePlanifieeFin'],
      message: 'La date de fin planifiée doit être postérieure ou égale à la date de début',
    });
  }
  if (data.dateRealiseeFin && data.dateRealisee && data.dateRealiseeFin < data.dateRealisee) {
    ctx.addIssue({
      code: 'custom',
      path: ['dateRealiseeFin'],
      message: 'La date de fin réalisée doit être postérieure ou égale à la date de début',
    });
  }
  if (data.dateRealiseeFin && !data.dateRealisee) {
    ctx.addIssue({
      code: 'custom',
      path: ['dateRealisee'],
      message: 'La date de début réalisée est requise si une date de fin est renseignée',
    });
  }
}

export const createVisiteSchema = baseVisiteSchema.superRefine(checkIntervals);

export const updateVisiteSchema = baseVisiteSchema.partial().superRefine(checkIntervals);
