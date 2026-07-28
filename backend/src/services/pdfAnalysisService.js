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