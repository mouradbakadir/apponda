import { logger } from '../../utils/logger.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL || 'llama3.2';
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'qwen2.5vl';
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

const TIMEOUT_MS = 240_000;

// Ollama n'est utilisable que si un serveur local a explicitement été
// declaré : sans OLLAMA_BASE_URL, l'URL par défaut ci-dessus pointe vers
// un localhost qui n'existe pas dans un conteneur de production, et chaque
// appel finirait en erreur de connexion.
function isConfigured() {
  return Boolean(process.env.OLLAMA_BASE_URL);
}

async function callOllama(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, stream: false }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama a répondu ${res.status} : ${errText.slice(0, 500)}`);
    }

    const data = await res.json();
    return data.response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Ollama n'a pas répondu dans le délai de ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Tente d'extraire un objet JSON exploitable d'une réponse potentiellement
 * mal formée : coupe tout ce qui suit la dernière accolade fermante valide.
 */
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

async function transcribeImage(imageBase64, prompt) {
  logger.info(`🖼️  [ollama] Appel vision (modèle: ${OLLAMA_VISION_MODEL})`);
  const response = await callOllama({
    model: OLLAMA_VISION_MODEL,
    prompt,
    images: [imageBase64],
    options: { temperature: 0.1 },
  });
  logger.info(`🖼️  [ollama] Réponse vision reçue (${response.length} caractères)`);
  return response;
}

async function structureText(prompt, maxAttempts = 2) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.info(`📝 [ollama] Appel structuration texte (modèle: ${OLLAMA_TEXT_MODEL}, tentative ${attempt}/${maxAttempts})`);
    const response = await callOllama({
      model: OLLAMA_TEXT_MODEL,
      prompt,
      format: 'json',
      options: { temperature: 0.2 },
    });

    try {
      return JSON.parse(response);
    } catch (err) {
      const repaired = tryRepairJson(response);
      if (repaired) {
        logger.warn(`⚠️  [ollama] JSON initial invalide mais réparé automatiquement (tentative ${attempt})`);
        return repaired;
      }
      lastError = err;
      logger.warn(`⚠️  [ollama] JSON invalide à la tentative ${attempt}/${maxAttempts} : ${err.message}`);
    }
  }

  throw new Error(`Ollama a renvoyé du JSON invalide après ${maxAttempts} tentatives : ${lastError.message}`);
}

/**
 * Embedding via l'API dédiée d'Ollama (/api/embeddings, différente de
 * /api/generate) -- nécessite d'avoir tiré un modèle d'embedding local au
 * préalable (ex: `ollama pull nomic-embed-text`), sinon cette fonction
 * lancera une erreur explicite au premier appel, pas avant.
 */
async function embed(text) {
  logger.info(`🔢 [ollama] Appel embedding (modèle: ${OLLAMA_EMBEDDING_MODEL})`);
  const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_EMBEDDING_MODEL, prompt: text }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama embeddings a répondu ${res.status} : ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  return data.embedding;
}

/** @type {import('../AIProvider.interface.js').AIProvider} */
export const ollamaProvider = {
  name: 'ollama',
  isConfigured,
  transcribeImage,
  structureText,
  embed,
  // Ollama local (CPU, un seul modèle chargé) ne bénéficie d'AUCUNE
  // parallélisation réelle -- des appels simultanés se partagent les
  // mêmes ressources et se ralentissent mutuellement jusqu'au timeout,
  // comme observé en test (job 64, timeout à 240s sous concurrence 3).
  recommendedConcurrency: 1,
};