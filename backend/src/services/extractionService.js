import { analyzeSelectedPages } from './pdfAnalysisService.js';
import { callOllamaVision, callOllamaText } from './ollamaService.js';
import { TRANSCRIPTION_PROMPT, buildStructurationPrompt } from '../prompts/marcheExtraction.prompts.js';
import { extractedMarcheSchema } from '../validators/extraction.validator.js';
import { calculateConfidenceScore } from './confidenceScoreService.js';
import { logger } from '../utils/logger.js';

/**
 * @param {Buffer} buffer
 * @param {number[]} selectedPages
 * @param {{nom: string, ville: string}} airportContext - aéroport de l'utilisateur qui upload
 *   (vient du contexte d'authentification/tenantScope, JAMAIS déduit du PDF -- voir note sécurité)
 */
export async function extractDocument(buffer, selectedPages, airportContext) {
  const pageAnalyses = await analyzeSelectedPages(buffer, selectedPages);
  logger.info(`📄 [extraction] ${pageAnalyses.length} page(s) analysée(s) pour l'aéroport ${airportContext.nom}`);

  const textParts = [];
  for (const page of pageAnalyses) {
    if (page.isNative) {
      textParts.push(`--- Page ${page.pageNumber} (texte natif) ---\n${page.text}`);
    } else {
      const ocrText = await callOllamaVision(page.imageBase64, TRANSCRIPTION_PROMPT);
      textParts.push(`--- Page ${page.pageNumber} (OCR vision) ---\n${ocrText}`);
    }
  }
  const rawText = textParts.join('\n\n');

  const structurationPrompt = buildStructurationPrompt(rawText, airportContext);
  const rawJson = await callOllamaText(structurationPrompt);

  const parseResult = extractedMarcheSchema.safeParse(rawJson);
  if (!parseResult.success) {
    logger.error({ zodError: parseResult.error.issues }, '⚠️  [extraction] JSON extrait non conforme au schéma, on continue quand même');
  }
  const extractedJson = parseResult.success ? parseResult.data : rawJson;

  // Vérification de cohérence aéroport : est-ce que le texte brut mentionne
  // bien l'aéroport de l'utilisateur ? Si non, c'est un signal fort que le
  // mauvais document a été uploadé (ou uploadé dans le mauvais contexte
  // aéroport) -- on baisse fortement la confiance plutôt que de rejeter,
  // pour laisser l'humain trancher à l'Étape G.
  const airportMentioned = rawText.toLowerCase().includes(airportContext.ville.toLowerCase())
    || rawText.toLowerCase().includes(airportContext.nom.toLowerCase());
  if (!airportMentioned) {
    logger.warn(`⚠️  [extraction] L'aéroport "${airportContext.nom}" n'apparaît nulle part dans le texte extrait -- document potentiellement mal classé`);
  }

  const confidenceScore = calculateConfidenceScore(extractedJson, { airportMentioned });

  return { extractedJson, confidenceScore, rawTextLength: rawText.length, airportMentioned };
}