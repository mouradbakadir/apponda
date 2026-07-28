export const TRANSCRIPTION_PROMPT = `Tu regardes une page scannée d'un document administratif marocain (marché public de l'ONDA - Office National Des Aéroports).

Transcris FIDÈLEMENT tout le texte visible sur cette image, y compris :
- le texte imprimé
- le texte manuscrit (numéros de marché écrits à la main, annotations)
- le contenu des tampons et cachets (dates, numéros, mentions)
- les montants, même écrits en toutes lettres

Ne résume pas, n'interprète pas, ne corrige pas l'orthographe. Si un mot est illisible, écris [ILLISIBLE] à sa place plutôt que de deviner.
Réponds uniquement avec le texte transcrit, sans commentaire ni introduction.`;

/**
 * @param {string} rawText
 * @param {{nom: string, ville: string}} airportContext
 */
export function buildStructurationPrompt(rawText, airportContext) {
  return `Voici le texte extrait de plusieurs pages d'un marché public de l'ONDA (Office National Des Aéroports du Maroc) :

"""
${rawText}
"""

CONTEXTE : ce document est uploadé par un utilisateur rattaché à l'aéroport "${airportContext.nom}" (${airportContext.ville}). Certains marchés couvrent plusieurs aéroports d'une même région dans un seul document (marchés "Lot") -- dans ce cas, les montants et l'objet concernent le marché ENTIER, pas un seul aéroport du lot.

Extrait UNIQUEMENT les champs suivants, nécessaires pour pré-remplir un formulaire de création de marché. Réponds avec un objet JSON respectant EXACTEMENT cette structure (utilise null pour toute information absente du texte, n'invente JAMAIS une valeur) :

{
  "numeroMarche": string ou null,        // ex: "014/24" -- cherche près de "Marché N°" en couverture
  "objet": string ou null,               // l'objet du marché tel que décrit à l'Article "OBJET DU MARCHE"
  "typeMaintenance": "PREVENTIVE" ou "CORRECTIVE" ou "MIXTE" ou null,  // déduis du texte : si le document mentionne à la fois maintenance préventive ET corrective -> "MIXTE"
  "slaDisponibilite": number ou null,    // en pourcentage, ex: 98 (PAS 0.98). Cherche "Disponibilité" dans la section objectifs/niveau de service
  "slaPrr": number ou null,              // en pourcentage, ex: 100. Cherche "PRR" ou "Taux de respect du planning"
  "slaMrt": number ou null,              // ⚠️ IMPORTANT : ce champ doit être en MINUTES, pas en heures. Si le texte indique "7 H" ou "7 heures", convertis en multipliant par 60 -> réponds 420, pas 7.
  "dateDebut": string ou null,           // format YYYY-MM-DD si une date de début de prestation est trouvable
  "dateFin": string ou null,             // format YYYY-MM-DD
  "montantTotal": number ou null         // montant annuel TTC en chiffres (DH), cherche "Montant annuel T.V.A. comprise"
}

Réponds uniquement avec ce JSON, sans texte avant ou après.`;
}