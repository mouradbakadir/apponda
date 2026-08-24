import { logger } from '../../utils/logger.js';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 120_000;

function requireGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const visionModel = process.env.GEMINI_VISION_MODEL;
  const textModel = process.env.GEMINI_TEXT_MODEL;
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL;

  // Défense en profondeur : env.js valide déjà ces variables au démarrage
  // si AI_PROVIDER=gemini, mais on revérifie ici pour ne jamais dépendre
  // silencieusement d'une variable manquante en cas d'appel direct du module.
  if (!apiKey || !visionModel || !textModel || !embeddingModel) {
    throw new Error('Configuration Gemini incomplète (GEMINI_API_KEY / GEMINI_VISION_MODEL / GEMINI_TEXT_MODEL / GEMINI_EMBEDDING_MODEL)');
  }
  return { apiKey, visionModel, textModel, embeddingModel };
}

function isConfigured() {
  return Boolean(
    process.env.GEMINI_API_KEY
    && process.env.GEMINI_VISION_MODEL
    && process.env.GEMINI_TEXT_MODEL
    && process.env.GEMINI_EMBEDDING_MODEL
  );
}

async function callGemini(model, body, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${GEMINI_API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini a répondu ${res.status} : ${errText.slice(0, 500)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text === undefined) {
      throw new Error(`Réponse Gemini inattendue, aucun texte trouvé : ${JSON.stringify(data).slice(0, 300)}`);
    }
    return text;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Gemini n'a pas répondu dans le délai de ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function transcribeImage(imageBase64, prompt) {
  const { apiKey, visionModel } = requireGeminiConfig();
  logger.info(`🖼️  [gemini] Appel vision (modèle: ${visionModel})`);

  const response = await callGemini(visionModel, {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: 'image/png', data: imageBase64 } },
      ],
    }],
    generationConfig: { temperature: 0.1 },
  }, apiKey);

  logger.info(`🖼️  [gemini] Réponse vision reçue (${response.length} caractères)`);
  return response;
}

function tryRepairJson(rawResponse) {
  const lastBrace = rawResponse.lastIndexOf('}');
  if (lastBrace === -1) return null;
  const candidate = rawResponse.slice(0, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

async function structureText(prompt, maxAttempts = 2) {
  const { apiKey, textModel } = requireGeminiConfig();
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.info(`📝 [gemini] Appel structuration texte (modèle: ${textModel}, tentative ${attempt}/${maxAttempts})`);
    const response = await callGemini(textModel, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json', // équivalent du format:'json' d'Ollama -- force une sortie JSON
      },
    }, apiKey);

    try {
      return JSON.parse(response);
    } catch (err) {
      const repaired = tryRepairJson(response);
      if (repaired) {
        logger.warn(`⚠️  [gemini] JSON initial invalide mais réparé automatiquement (tentative ${attempt})`);
        return repaired;
      }
      lastError = err;
      logger.warn(`⚠️  [gemini] JSON invalide à la tentative ${attempt}/${maxAttempts} : ${err.message}`);
    }
  }

  throw new Error(`Gemini a renvoyé du JSON invalide après ${maxAttempts} tentatives : ${lastError.message}`);
}

async function embed(text) {
  const { apiKey, embeddingModel } = requireGeminiConfig();
  logger.info(`🔢 [gemini] Appel embedding (modèle: ${embeddingModel})`);

  const res = await fetch(`${GEMINI_API_BASE}/${embeddingModel}:embedContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini embeddings a répondu ${res.status} : ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

/** @type {import('../AIProvider.interface.js').AIProvider} */
export const geminiProvider = {
  name: 'gemini',
  isConfigured,
  transcribeImage,
  structureText,
  embed,
  // API cloud avec de vraies capacités de traitement parallèle -- on reste
  // prudent à 3 pour respecter la limite de 15 requêtes/minute du niveau
  // gratuit (voir discussion Phase 0).
  recommendedConcurrency: 3,
};