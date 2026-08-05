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

CONTEXTE : ce document est uploadé pour l'aéroport "${airportContext.nom}" (${airportContext.ville}). Cet aéroport a été choisi EXPLICITEMENT par l'utilisateur (jamais déduit automatiquement du contenu du PDF) -- fais-lui une confiance totale sur son identité, ta seule tâche est d'extraire, PARMI les informations présentes dans le texte, celles qui concernent CET aéroport précis.

ATTENTION -- MARCHÉS "LOT" MULTI-AÉROPORTS : certains marchés ONDA (ex: "Lot 2 : Région d'Agadir") couvrent PLUSIEURS aéroports sous un même numéro de marché et un même objet global. Dans ce cas :
  - "numeroMarche", "objet", "typeMaintenance", "montantTotal" et "penaliteParInfraction" concernent le marché DANS SON ENSEMBLE (le lot entier) -- utilise ces valeurs globales même si elles ne mentionnent pas nommément "${airportContext.nom}".
  - "slaDisponibilite", "slaPrr" et surtout "slaMrt" (temps de rétablissement) PEUVENT être DIFFÉRENTS par aéroport au sein d'un même lot. Exemple réel rencontré : un même marché prévoit "7H pour l'aéroport d'Agadir/Al Massira", "12H pour l'aéroport de Guélmime", "24H pour l'aéroport de Dakhla" -- ce sont TROIS valeurs de MRT différentes pour TROIS aéroports du même lot, pas une seule valeur pour tous.
  - Quand tu vois une liste de valeurs par aéroport pour un champ SLA (slaDisponibilite, slaPrr, slaMrt), cherche EXPLICITEMENT la ligne qui mentionne "${airportContext.nom}" (ou "${airportContext.ville}") et n'extrais QUE cette valeur-là pour ce champ. Ignore les valeurs des autres aéroports listés.
  - Si un champ SLA est donné comme une valeur UNIQUE partagée par tout le lot (pas de distinction par aéroport dans le texte), utilise cette valeur unique -- ne réponds JAMAIS null sous prétexte qu'elle n'est pas répétée nommément pour "${airportContext.nom}".
  - Si un champ SLA liste des valeurs par aéroport mais qu'aucune ne correspond à "${airportContext.nom}" ou "${airportContext.ville}", réponds null pour ce champ plutôt que de deviner ou de prendre la valeur d'un autre aéroport.

Extrait UNIQUEMENT les champs suivants, nécessaires pour pré-remplir un formulaire de création de marché. Réponds avec un objet JSON respectant EXACTEMENT cette structure (utilise null pour toute information absente du texte, n'invente JAMAIS une valeur) :

{
  "numeroMarche": string ou null,        // ex: "014/24" -- cherche près de "Marché N°" en couverture
  "objet": string ou null,               // l'objet du marché tel que décrit à l'Article "OBJET DU MARCHE"
  "typeMaintenance": "PREVENTIVE" ou "CORRECTIVE" ou "MIXTE" ou null,  // déduis du texte : si le document mentionne à la fois maintenance préventive ET corrective -> "MIXTE"
  "slaDisponibilite": number ou null,    // en pourcentage, ex: 98 (PAS 0.98). Cherche "Disponibilité" dans la section objectifs/niveau de service -- voir note "LOT" ci-dessus si plusieurs aéroports
  "slaPrr": number ou null,              // en pourcentage, ex: 100. Cherche "PRR" ou "Taux de respect du planning" -- voir note "LOT" ci-dessus si plusieurs aéroports
  "slaMrt": number ou null,              // ⚠️ IMPORTANT : ce champ doit être en MINUTES, pas en heures. Si le texte indique "7 H" ou "7 heures", convertis en multipliant par 60 -> réponds 420, pas 7. ⚠️ Voir aussi la note "LOT" ci-dessus : ce champ varie souvent par aéroport, prends STRICTEMENT la valeur de "${airportContext.nom}"
  "dateDebut": string ou null,           // format YYYY-MM-DD si une date de début de prestation est trouvable
  "dateFin": string ou null,             // format YYYY-MM-DD
  "montantTotal": number ou null         // montant annuel TTC en chiffres (DH), cherche "Montant annuel T.V.A. comprise" -- valeur du lot entier, voir note "LOT" ci-dessus
}

Réponds uniquement avec ce JSON, sans texte avant ou après.`;
}