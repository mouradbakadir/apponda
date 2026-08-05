import { PDFParse } from 'pdf-parse';

// Seuil en dessous duquel on considère qu'une page n'a PAS de texte natif
// exploitable (bruit résiduel du scan : quelques caractères OCR fantômes,
// numéros de page injectés par un logiciel de scan, etc.). Sur tes 2 PDF
// réels, la moyenne mesurée était ~18 caractères/page pour des pages
// entièrement scannées -- on met la barre à 40 pour rester prudent.
const NATIVE_TEXT_THRESHOLD = 40;

// scale=1.5 : compromis entre lisibilité (tampons, signatures, petites
// polices) et taille de l'image envoyée à Ollama vision (temps d'inférence
// + mémoire). scale=2 donne une image ~2x plus lourde pour un gain de
// lisibilité marginal sur des tampons déjà nets.
const RENDER_SCALE = 1.5;

// Nombre maximum de pages analysées automatiquement quand l'utilisateur n'a
// pas encore de sélecteur de pages dans l'UI (Étape CAS 1, MVP). Au-delà,
// on tronque plutôt que de lancer une extraction potentiellement très
// longue (chaque page non-native coûte un appel vision de plusieurs
// secondes) sur un document de 100+ pages par erreur.
const MAX_AUTO_PAGES = 15;

/**
 * Retourne le nombre total de pages d'un PDF, sans analyser leur contenu.
 * Utilisé quand l'appelant n'a pas encore choisi de pages précises
 * (upload direct depuis le formulaire "Nouveau Marché", sans sélecteur de
 * pages) : on doit savoir combien de pages existent avant de décider
 * lesquelles envoyer à l'extraction.
 *
 * @param {Buffer} buffer
 * @returns {Promise<number>}
 */
export async function getPdfPageCount(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const info = await parser.getInfo();
    return info.total;
  } finally {
    await parser.destroy();
  }
}

/**
 * Calcule la liste de pages à analyser quand l'utilisateur n'en a fourni
 * aucune explicitement. Prend les `MAX_AUTO_PAGES` premières pages du
 * document (les informations administratives -- couverture, acte
 * d'engagement, objet, articles SLA -- se trouvent presque toujours en
 * début de marché ONDA), et journalise un avertissement si le document est
 * plus long et donc partiellement ignoré.
 *
 * @param {Buffer} buffer
 * @returns {Promise<number[]>}
 */
export async function computeDefaultSelectedPages(buffer) {
  const total = await getPdfPageCount(buffer);
  const pageCount = Math.min(total, MAX_AUTO_PAGES);
  return Array.from({ length: pageCount }, (_, i) => i + 1);
}

/**
 * Analyse les pages sélectionnées d'un PDF et retourne, pour chacune,
 * soit son texte natif (si présent), soit une image PNG base64 prête à
 * être envoyée à Ollama vision.
 *
 * @param {Buffer} buffer - contenu du PDF
 * @param {number[]} selectedPages - numéros de page (1-indexé) choisis par l'utilisateur
 * @returns {Promise<Array<{pageNumber: number, isNative: boolean, text: string|null, imageBase64: string|null}>>}
 */
export async function analyzeSelectedPages(buffer, selectedPages) {
  if (!Array.isArray(selectedPages) || selectedPages.length === 0) {
    throw new Error('Aucune page sélectionnée pour l\'extraction');
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const results = [];

    for (const pageNumber of selectedPages) {
      const textResult = await parser.getText({ partial: [pageNumber] });
      const pageText = (textResult.pages[0]?.text || '').trim();

      if (pageText.length >= NATIVE_TEXT_THRESHOLD) {
        // Texte natif exploitable : pas besoin de vision pour cette page,
        // plus rapide ET plus fiable qu'une OCR.
        results.push({ pageNumber, isNative: true, text: pageText, imageBase64: null });
      } else {
        // Pas assez de texte natif : on rend la page en image pour la vision.
        const screenshotResult = await parser.getScreenshot({
          partial: [pageNumber],
          scale: RENDER_SCALE,
          imageDataUrl: true,
        });
        const dataUrl = screenshotResult.pages[0]?.dataUrl;
        if (!dataUrl) {
          throw new Error(`Impossible de rendre la page ${pageNumber} en image`);
        }
        const imageBase64 = dataUrl.split(',')[1]; // on retire le préfixe "data:image/png;base64,"
        results.push({ pageNumber, isNative: false, text: null, imageBase64 });
      }
    }

    return results;
  } finally {
    await parser.destroy(); // libère la mémoire pdfjs, important sur des PDF de 30+ pages
  }
}