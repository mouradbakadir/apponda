import { logger } from '../utils/logger.js';

// Nombre maximum de pages retenues après ciblage -- filet de sécurité si
// la table des matières est mal formée et produirait un résultat trop large.
const MAX_TARGETED_PAGES = 10;

// Chaque entrée : mots-clés à chercher dans le titre d'un article de la
// table des matières -> aucune association explicite à un champ ici, le
// mapping sert uniquement à SÉLECTIONNER les bonnes pages, l'extraction
// elle-même reste gérée par le prompt existant.
const RELEVANT_KEYWORDS = [
  'OBJET DU MARCHE',
  'DUREE DU MARCHE',
  'PENALITES',
  'NIVEAU DE SERVICE',      // couvre "SPECIFICATION DU NIVEAU DE SERVICE" et "OBJECTIFS DU NIVEAU DE SERVICE"
  'BORDEREAU DES PRIX',
  'MAINTENANCE PREVENTIVE',
  'MAINTENANCE CORRECTIVE',
  'MODE DE PAIEMENT',
];

/**
 * Parse un texte de table des matières (déjà transcrit) et retourne la
 * liste ordonnée des entrées trouvées : [{ titre, page }, ...].
 * Fonction PURE, testable sans aucun appel IA -- c'est volontaire, pour
 * pouvoir vérifier la logique de parsing indépendamment de la qualité de
 * l'OCR d'un fournisseur donné.
 *
 * @param {string} text
 * @returns {Array<{titre: string, page: number}>}
 */
export function parseTableOfMatieres(text) {
  const entries = [];
  // Tolérant sur la mise en forme : "ARTICLE 30 :", "ARTICLE 30:", tirets
  // ou points de leader avant le numéro de page, espaces variables --
  // l'OCR ne reproduit jamais la mise en page de façon parfaitement stable.
  const lineRegex = /^(ARTICLE\s+\d+|PARTIE\s+[IVXLCDM]+)\s*[:\-]?\s*(.+?)[\s._]{2,}(\d{1,3})\s*$/gim;

  let match;
  while ((match = lineRegex.exec(text)) !== null) {
    const [, prefix, titre, pageStr] = match;
    entries.push({
      titre: `${prefix} : ${titre.trim()}`.toUpperCase(),
      page: parseInt(pageStr, 10),
    });
  }

  return entries.sort((a, b) => a.page - b.page);
}
/**
 * À partir des entrées de la table des matières, calcule l'ensemble des
 * pages à cibler, en deux passes :
 *   1. Garantir la première page de CHAQUE article pertinent -- priorité
 *      absolue, pour ne jamais perdre un article entier (ex: le Bordereau
 *      des Prix en fin de document) au profit de pages de continuation
 *      d'un article antérieur.
 *   2. Si le budget restant le permet, ajouter des pages de continuation
 *      (le contenu utile déborde souvent sur 1-2 pages suivantes), dans
 *      l'ordre des articles, jusqu'à épuisement du budget.
 *
 * @param {Array<{titre: string, page: number}>} entries
 * @returns {number[]}
 */
export function computeTargetedPages(entries) {
  if (entries.length === 0) return [];

  const relevantEntries = entries.filter((entry) =>
    RELEVANT_KEYWORDS.some((kw) => entry.titre.includes(kw))
  );

  // Passe 1 : une page par article pertinent, garantie, jamais sacrifiée.
  const targeted = new Set([1, ...relevantEntries.map((e) => e.page)]);

  // Passe 2 : pages de continuation, seulement si le budget le permet encore.
  let budget = MAX_TARGETED_PAGES - targeted.size;
  for (const entry of relevantEntries) {
    if (budget <= 0) break;

    const nextEntryPage = entries.find((e) => e.page > entry.page)?.page;
    const continuationLimit = nextEntryPage
      ? Math.min(entry.page + 2, nextEntryPage - 1)
      : entry.page + 2;

    for (let p = entry.page + 1; p <= continuationLimit && budget > 0; p++) {
      if (!targeted.has(p)) {
        targeted.add(p);
        budget--;
      }
    }
  }

  return [...targeted].sort((a, b) => a - b);
}

/**
 * Tente d'affiner une sélection de pages "par défaut" (large, aveugle) en
 * une sélection ciblée, en lisant la table des matières du document.
 * Ne fait AUCUN appel IA supplémentaire au-delà des 2-3 premières pages
 * qui auraient de toute façon été transcrites -- c'est un raffinement, pas
 * un coût ajouté.
 *
 * @param {Array<{pageNumber: number, isNative: boolean, text: string|null}>} earlyPagesTranscribed
 *   Les 2-3 premières pages, DÉJÀ transcrites par l'appelant (voir extractionService.js).
 * @param {number[]} fallbackPages - la sélection d'origine, utilisée si aucune TOC n'est trouvée
 * @returns {number[] | null} - null si aucune table des matières détectée (l'appelant garde fallbackPages)
 */
export function refineViaTableOfMatieres(earlyPagesTranscribed, fallbackPages) {
  const combinedText = earlyPagesTranscribed.map((p) => p.text || '').join('\n');

  if (!/TABLE\s+DES\s+MATI[EÈ]RES|SOMMAIRE/i.test(combinedText)) {
    logger.info('📑 [page-targeting] Aucune table des matières détectée, conservation de la sélection par défaut');
    return null;
  }

  const entries = parseTableOfMatieres(combinedText);
  if (entries.length === 0) {
    logger.warn('⚠️  [page-targeting] Table des matières détectée mais non exploitable (format inattendu), conservation de la sélection par défaut');
    return null;
  }

  const targeted = computeTargetedPages(entries);

  // Filet de sécurité : si le ciblage est trop étroit (trop peu d'articles
  // pertinents détectés, ou continuation clippée par un article suivant
  // trop proche dans la table -- cas réel observé : "1 article(s) trouvé(s),
  // 1 page(s) ciblée(s)", confiance 0% résultante), on ne fait PAS confiance
  // à ce ciblage. Mieux vaut retomber sur la sélection par défaut (plus
  // large, donc plus lente, mais qui couvre réellement le document) que de
  // produire une extraction quasi vide.
  const MIN_SAFE_TARGETED_PAGES = 4;
  if (targeted.length < MIN_SAFE_TARGETED_PAGES) {
    logger.warn(`⚠️  [page-targeting] Ciblage jugé trop étroit (${targeted.length} page(s) seulement, ${entries.length} article(s) détecté(s)), conservation de la sélection par défaut`);
    return null;
  }

  logger.info(`📑 [page-targeting] Table des matières exploitée : ${entries.length} article(s) trouvé(s), ${targeted.length} page(s) ciblée(s) (au lieu de ${fallbackPages.length})`);
  return targeted;
}