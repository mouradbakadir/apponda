import { logger } from '../../utils/logger.js';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const TIMEOUT_MS = 60_000;

function requireGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
  const textModel = process.env.GROQ_TEXT_MODEL || 'qwen/qwen3.6-27b';
  const visionModel = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';

  if (!apiKey) {
    throw new Error('Configuration Groq incomplète : GROQ_API_KEY manquante');
  }
  return { apiKey, textModel, visionModel };
}

async function callGroqChat(messages, options = {}) {
  const { apiKey, textModel } = requireGroqConfig();
  const model = options.model || textModel;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.1,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq a répondu ${res.status} : ${errText.slice(0, 500)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Groq n'a pas répondu dans le délai de ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function transcribeImage(imageBase64, prompt) {
  const { visionModel } = requireGroqConfig();
  logger.info(`🖼️  [groq] Appel vision / transcription (modèle: ${visionModel})`);

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
    const response = await callGroqChat(messages, { model: visionModel });
    logger.info(`🖼️  [groq] Réponse vision reçue (${response.length} caractères)`);
    return response;
  } catch (err) {
    logger.warn(`⚠️  [groq] Échec vision, repli sur transcription textuelle : ${err.message}`);
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
  const { textModel } = requireGroqConfig();
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.info(`📝 [groq] Appel structuration texte (modèle: ${textModel}, tentative ${attempt}/${maxAttempts})`);

    const messages = [
      {
        role: 'system',
        content: 'Tu es un assistant expert en extraction de données administratives et marchés publics marocains ONDA. Réponds UNIQUEMENT en JSON valide conforme au schéma demandé.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const response = await callGroqChat(messages, { jsonMode: true, temperature: 0.1 });
      const parsed = JSON.parse(response);
      return parsed;
    } catch (err) {
      lastError = err;
      logger.warn(`⚠️  [groq] Erreur parsing JSON (tentative ${attempt}) : ${err.message}`);
    }
  }

  throw new Error(`Groq n'a pas pu structurer le texte en JSON valide : ${lastError?.message}`);
}

async function embed(text) {
  logger.info(`🔢 [groq] Embedding simulé normalisé`);
  return Array.from({ length: 768 }, () => Math.random() * 0.01);
}

/** @type {import('../AIProvider.interface.js').AIProvider} */
export const groqProvider = {
  transcribeImage,
  structureText,
  embed,
  recommendedConcurrency: 4,
};
