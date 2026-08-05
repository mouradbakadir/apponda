import { z } from 'zod';

const membreSchema = z.object({
  role: z.enum(['Chef de Projet', 'Responsable Technique', 'Technicien', 'Contact Commercial']),
  nom: z.string().min(1),
  email: z.string().email(),
  telephone: z.string().min(1),
});

// Convertit une chaîne vide "" en null (PAS undefined) -- Prisma traite
// `undefined` comme "champ non fourni, ne pas y toucher" et `null` comme
// "effacer la valeur en base". Comme le formulaire envoie toujours "" (et
// jamais undefined) quand l'utilisateur vide un champ, il faut null ici
// pour que la suppression du contenu soit réellement appliquée en
// modification, pas juste ignorée silencieusement.
const optionalTelephone = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().min(1).nullable().optional()
);
const optionalEmail = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().email().nullable().optional()
);

export const createSocieteSchema = z.object({
  marcheId: z.string().uuid(),
  raisonSociale: z.string().min(1),
  telephone: optionalTelephone,
  emailContact: optionalEmail,
  membres: z.array(membreSchema).optional().default([]),
});

export const updateSocieteSchema = createSocieteSchema.partial();