import { logger } from '../utils/logger.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL || 'llama3.2';
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'qwen2.5vl';

const TIMEOUT_MS = 120_000;

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

export async function callOllamaVision(imageBase64, prompt) {
  logger.info(`🖼️  [ollama] Appel vision (modèle: ${OLLAMA_VISION_MODEL})`);
  const response = await callOllama({
    model: OLLAMA_VISION_MODEL,
    prompt,
    images: [imageBase64],
    options: { temperature: 0.1 }, // transcription : on veut de la fidélité, pas de la créativité
  });
  logger.info(`🖼️  [ollama] Réponse vision reçue (${response.length} caractères)`);
  return response;
}

/**
 * Tente d'extraire un objet JSON exploitable d'une réponse potentiellement
 * mal formée : coupe tout ce qui suit la dernière accolade fermante valide.
 * Filet de sécurité pour les cas où le modèle "dérape" après avoir produit
 * un JSON par ailleurs correct (fin de réponse qui part en vrille).
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

/**
 * Structure un texte libre en JSON. Réessaie automatiquement en cas de
 * JSON invalide -- format:'json' force Ollama à CONTRAINDRE la sortie,
 * mais ça n'élimine pas totalement le risque avec un petit modèle local,
 * surtout sur des prompts contenant du texte utilisateur imprévisible.
 * @param {string} prompt
 * @param {number} maxAttempts
 */
export async function callOllamaText(prompt, maxAttempts = 2) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.info(`📝 [ollama] Appel structuration texte (modèle: ${OLLAMA_TEXT_MODEL}, tentative ${attempt}/${maxAttempts})`);
    const response = await callOllama({
      model: OLLAMA_TEXT_MODEL,
      prompt,
      format: 'json',
      options: { temperature: 0.2 }, // structuration : discipline de format avant tout, peu de créativité nécessaire
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