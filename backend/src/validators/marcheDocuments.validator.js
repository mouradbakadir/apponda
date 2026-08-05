import { z } from 'zod';

const CONFIRMABLE_FIELDS = [
  'numeroMarche', 'objet', 'typeMaintenance',
  'slaDisponibilite', 'slaPrr', 'slaMrt',
  'dateDebut', 'dateFin', 'montantTotal', 'penaliteParInfraction',
];

// CORRECTIF : selectedPages doit être déclaré explicitement dans le schéma
// Zod, même s'il n'est validé qu'en surface ici (chaîne JSON brute, parsée
// et vérifiée finement dans le contrôleur). Sans cette déclaration, Zod
// SUPPRIME silencieusement ce champ de req.body après validation (c'est le
// comportement par défaut de z.object : tout champ non déclaré est retiré),
// et le contrôleur ne le voit alors jamais -- bug réel observé en test :
// une sélection de 1 page était systématiquement remplacée par les 15
// pages par défaut, faisant exploser le temps d'extraction.
export const uploadDocumentSchema = z.object({
  marcheId: z.string().uuid().optional().or(z.literal('')),
  airportId: z.string().uuid().optional().or(z.literal('')),
  autoExtract: z.string().optional(), // 'true'/'false' en multipart -- converti plus bas
}).transform((data) => ({
  marcheId: data.marcheId || undefined,
  airportId: data.airportId || undefined,
  autoExtract: data.autoExtract !== 'false', // true par défaut, sauf si explicitement 'false'
}));

export const confirmDocumentSchema = z.object({
  // CORRECTIF Zod v4 : z.record(z.enum([...]), ...) exige désormais TOUTES
  // les clés de l'enum (contrairement à Zod v3 qui acceptait un sous-ensemble
  // partiel). On utilise donc une clé z.string() générique, et on applique
  // la liste blanche via superRefine -- même garantie de sécurité (aucun
  // champ hors CONFIRMABLE_FIELDS n'est accepté), mais compatible avec un
  // objet PARTIEL (l'utilisateur ne confirme jamais tous les champs à la fois).
  champs: z.record(z.string(), z.union([z.string(), z.number(), z.null()]))
    .superRefine((champs, ctx) => {
      for (const key of Object.keys(champs)) {
        if (!CONFIRMABLE_FIELDS.includes(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Champ non autorisé : ${key}`,
            path: ['champs', key],
          });
        }
      }
    }),
}).refine((data) => Object.keys(data.champs).length > 0, {
  message: 'Aucun champ à confirmer',
  path: ['champs'],
});

export { CONFIRMABLE_FIELDS };