import { z } from 'zod';

// NOTE IMPORTANTE (règle multi-aéroports) :
// `airportId` est volontairement OPTIONNEL ici, pas obligatoire au niveau
// du schéma Zod. La raison : l'obligation de ce champ dépend du RÔLE de
// l'utilisateur (obligatoire pour SUPER_ADMIN, interdit/ignoré pour
// SUPERVISEUR et TECHNICIEN), et Zod valide la requête AVANT que le
// contrôleur/service n'ait connaissance du rôle métier applicable à ce
// champ précis. On valide donc ici uniquement la FORME (uuid valide si
// présent), et la règle "obligatoire selon le rôle" vit dans
// marches.service.js, à côté de la logique déjà existante qui gère ce
// même genre de cas pour les entités enfants (voir equipements.service.js).
export const createMarcheSchema = z.object({
  airportId: z.string().uuid({ message: "L'aéroport sélectionné est invalide" }).optional(),
  numeroMarche: z.string().min(1),
  objet: z.string().min(1),
  statut: z.enum(['BROUILLON', 'ACTIF', 'EXPIRE', 'RESILIE']).optional(),
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
  // airportId n'est PAS modifiable via update : un marché ne change jamais
  // d'aéroport après sa création (ce serait une opération métier bien plus
  // lourde qu'un simple champ de formulaire -- elle impliquerait de migrer
  // aussi ses équipements, sociétés, etc.). Si ce besoin apparaît un jour,
  // il doit être traité comme une action dédiée, pas comme un champ PATCH
  // ordinaire.
  numeroMarche: z.string().min(1).optional(),
  objet: z.string().min(1).optional(),
  statut: z.enum(['BROUILLON', 'ACTIF', 'EXPIRE', 'RESILIE']).optional(),
  typeMaintenance: z.enum(['PREVENTIVE', 'CORRECTIVE', 'MIXTE']).optional(),
  slaDisponibilite: z.number().min(0).max(100).optional(),
  slaPrr: z.number().min(0).max(100).optional(),
  slaMrt: z.number().int().positive().optional(),
  dateDebut: z.string().datetime().or(z.string().date()).optional(),
  dateFin: z.string().datetime().or(z.string().date()).optional(),
  montantTotal: z.number().positive().nullable().optional(),
  penaliteParInfraction: z.number().positive().nullable().optional(),
}).refine(data => {
  if (data.dateDebut && data.dateFin) {
    return new Date(data.dateDebut) < new Date(data.dateFin);
  }
  return true;
}, {
  message: "La date de fin doit être strictement supérieure à la date de début",
  path: ["dateFin"]
});