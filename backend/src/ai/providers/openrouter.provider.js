import { logger } from '../../utils/logger.js';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS) || 60_000;

// "openrouter/auto" est le routeur automatique d'OpenRouter : c'est un
// identifiant de modèle réellement existant, contrairement à des valeurs
// inventées comme "openrouter/free" qui font expirer chaque requête au bout
// du délai d'attente au lieu de renvoyer une erreur exploitable.
const DEFAULT_MODEL = 'openrouter/auto';

function requireOpenRouterConfig() {
  // Pas de repli sur GEMINI_API_KEY : une clé Gemini envoyée à OpenRouter est
  // systématiquement rejetée, et masque la vraie cause (clé manquante).
  const apiKey = process.env.OPENROUTER_API_KEY;
  const textModel = process.env.OPENROUTER_TEXT_MODEL || DEFAULT_MODEL;
  const visionModel = process.env.OPENROUTER_VISION_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error('Configuration OpenRouter incomplète : OPENROUTER_API_KEY manquante');
  }
  return { apiKey, textModel, visionModel };
}

function isConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

async function callOpenRouterChat(messages, options = {}) {
  const { apiKey, textModel } = requireOpenRouterConfig();
  const model = options.model || textModel;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://amnt.up.railway.app',
        'X-Title': 'ONDA AMNT',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.1,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter a répondu ${res.status} : ${errText.slice(0, 500)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`OpenRouter n'a pas répondu dans le délai de ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function transcribeImage(imageBase64, prompt) {
  const { visionModel } = requireOpenRouterConfig();
  logger.info(`🖼️  [openrouter] Appel vision / transcription (modèle: ${visionModel})`);

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`,
          },
        },
      ],
    },
  ];

  try {
    const response = await callOpenRouterChat(messages, { model: visionModel });
    logger.info(`🖼️  [openrouter] Réponse vision reçue (${response.length} caractères)`);
    return response;
  } catch (err) {
    logger.warn(`⚠️  [openrouter] Échec vision, repli sur texte : ${err.message}`);
    return prompt;
  }
}

function tryRepairJson(rawResponse) {
  const firstBrace = rawResponse.indexOf('{');
  const lastBrace = rawResponse.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  const candidate = rawResponse.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

async function structureText(prompt, maxAttempts = 2) {
  const { textModel } = requireOpenRouterConfig();
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.info(`📝 [openrouter] Appel structuration texte (modèle: ${textModel}, tentative ${attempt}/${maxAttempts})`);

    const messages = [
      {
        role: 'system',
        content: 'Tu es un expert en analyse de marchés publics ONDA. Réponds UNIQUEMENT par un objet JSON valide conforme aux instructions.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Volontairement hors du try : une erreur de transport (délai dépassé,
    // clé invalide, modèle inexistant) ne sera pas résolue par une seconde
    // tentative identique -- elle doit remonter tout de suite pour laisser
    // la main au fournisseur de secours.
    const response = await callOpenRouterChat(messages, { temperature: 0.1 });

    try {
      return tryRepairJson(response) || JSON.parse(response);
    } catch (err) {
      lastError = err;
      logger.warn(`⚠️  [openrouter] Parsing JSON échoué (tentative ${attempt}) : ${err.message}`);
    }
  }

  throw new Error(`OpenRouter n'a pas pu structurer le texte en JSON valide : ${lastError?.message}`);
}

async function embed(text) {
  logger.info(`🔢 [openrouter] Embedding simulé normalisé`);
  return Array.from({ length: 768 }, () => Math.random() * 0.01);
}

/** @type {import('../AIProvider.interface.js').AIProvider} */
export const openrouterProvider = {
  name: 'openrouter',
  isConfigured,
  transcribeImage,
  structureText,
  embed,
  recommendedConcurrency: 3,
};
