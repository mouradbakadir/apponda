import { analyzeSelectedPages } from './pdfAnalysisService.js';
import { aiService } from '../ai/index.js';
import { TRANSCRIPTION_PROMPT, buildStructurationPrompt } from '../prompts/marcheExtraction.prompts.js';
import { extractedMarcheSchema } from '../validators/extraction.validator.js';
import { calculateConfidenceScore } from './confidenceScoreService.js';
import { refineViaTableOfMatieres } from './pageTargetingService.js';
import { mapWithConcurrency } from '../utils/concurrency.js';
import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';

function normalizeForMatch(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function transcribePage(page, documentId, partialPagesCache) {
  const cacheKey = String(page.pageNumber);

  if (partialPagesCache[cacheKey]) {
    logger.info(`♻️  [extraction] Page ${page.pageNumber} déjà transcrite (cache), réutilisation`);
    return { pageNumber: page.pageNumber, text: partialPagesCache[cacheKey] };
  }

  const text = page.isNative
    ? page.text
    : await aiService.transcribeImage(page.imageBase64, TRANSCRIPTION_PROMPT);

  partialPagesCache[cacheKey] = text;

  if (documentId) {
    await prisma.marcheDocument.update({
      where: { id: documentId },
      data: { partialPages: { ...partialPagesCache } },
    }).catch((err) => {
      logger.warn(`⚠️  [extraction] Échec sauvegarde incrémentale page ${page.pageNumber} : ${err.message}`);
    });
  }

  return { pageNumber: page.pageNumber, text };
}

/**
 * @param {Buffer} buffer
 * @param {number[]} selectedPages
 * @param {{nom: string, ville: string}} airportContext
 * @param {{documentId?: string, selectedPagesAuto?: boolean, partialPages?: object}} options
 */
export async function extractDocument(buffer, selectedPages, airportContext, options = {}) {
  const { documentId, selectedPagesAuto = false, partialPages = {} } = options;
  const partialPagesCache = { ...partialPages };

  // Concurrence propre à chaque fournisseur -- déclarée par le provider
  // lui-même (voir ollama.provider.js / gemini.provider.js), jamais une
  // constante fixe ici. Ollama local = 1 (aucun vrai parallélisme
  // possible sur une seule machine CPU), Gemini cloud = 3.
  const concurrency = aiService.recommendedConcurrency || 1;

  let pagesToAnalyze = selectedPages;

  if (selectedPagesAuto && selectedPages.length > 2) {
    const earlyPageNumbers = selectedPages.slice(0, 2);
    const earlyPageAnalyses = await analyzeSelectedPages(buffer, earlyPageNumbers);
    const earlyTranscribed = await mapWithConcurrency(earlyPageAnalyses, concurrency,
      (page) => transcribePage(page, documentId, partialPagesCache));

    const refined = refineViaTableOfMatieres(earlyTranscribed, selectedPages);
    if (refined) {
      pagesToAnalyze = refined;
    }
  }

  const pageAnalyses = await analyzeSelectedPages(buffer, pagesToAnalyze);
  logger.info(`📄 [extraction] ${pageAnalyses.length} page(s) analysée(s) pour l'aéroport ${airportContext.nom} (concurrence: ${concurrency})`);

  const transcribed = await mapWithConcurrency(pageAnalyses, concurrency,
    (page) => transcribePage(page, documentId, partialPagesCache));

  const rawText = transcribed
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`)
    .join('\n\n');

  const structurationPrompt = buildStructurationPrompt(rawText, airportContext);
  const rawJson = await aiService.structureText(structurationPrompt);

  const parseResult = extractedMarcheSchema.safeParse(rawJson);
  let extractedJson;
  if (parseResult.success) {
    extractedJson = parseResult.data;
  } else {
    logger.error({ zodError: parseResult.error.issues }, '⚠️  [extraction] JSON extrait non conforme au schéma -- nettoyage champ par champ');
    extractedJson = {};
    const fieldSchema = extractedMarcheSchema.shape;
    for (const key of Object.keys(fieldSchema)) {
      const fieldResult = fieldSchema[key].safeParse(rawJson[key]);
      extractedJson[key] = fieldResult.success ? fieldResult.data : null;
    }
  }

  const normalizedText = normalizeForMatch(rawText);
  const airportMentioned = normalizedText.includes(normalizeForMatch(airportContext.ville))
    || normalizedText.includes(normalizeForMatch(airportContext.nom));
  if (!airportMentioned) {
    logger.warn(`⚠️  [extraction] L'aéroport "${airportContext.nom}" n'apparaît nulle part dans le texte extrait -- document potentiellement mal classé`);
  }

  const confidenceScore = calculateConfidenceScore(extractedJson, { airportMentioned });

  return { extractedJson, confidenceScore, rawTextLength: rawText.length, airportMentioned, pagesActuallyUsed: pagesToAnalyze };
}