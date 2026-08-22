import 'dotenv/config';

const requiredVars = ['PORT', 'DATABASE_URL', 'FRONTEND_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`❌ Variable d'environnement manquante : ${key}`);
  }
}

// Sécurité : les secrets JWT doivent faire au minimum 32 caractères
if (process.env.JWT_ACCESS_SECRET.length < 32) {
  throw new Error('❌ JWT_ACCESS_SECRET doit avoir au moins 32 caractères');
}
if (process.env.JWT_REFRESH_SECRET.length < 32) {
  throw new Error('❌ JWT_REFRESH_SECRET doit avoir au moins 32 caractères');
}

// AI_PROVIDER : optionnel, "ollama" par défaut (comportement actuel inchangé).
// La validation des variables GEMINI_* n'est déclenchée QUE si AI_PROVIDER=gemini
// -- inutile d'exiger une clé Gemini pour quelqu'un qui reste en développement
// avec Ollama, et inversement, si on choisit Gemini, il faut être certain que
// toute la configuration nécessaire est bien présente AVANT que l'application
// ne démarre, plutôt que de découvrir une variable manquante au milieu d'une
// extraction en cours.
const aiProvider = process.env.AI_PROVIDER || 'ollama';
const validProviders = ['ollama', 'gemini', 'groq'];

if (!validProviders.includes(aiProvider)) {
  throw new Error(`❌ AI_PROVIDER invalide : "${aiProvider}" (valeurs acceptées : ${validProviders.join(', ')})`);
}

if (aiProvider === 'gemini') {
  const requiredGeminiVars = ['GEMINI_API_KEY', 'GEMINI_VISION_MODEL', 'GEMINI_TEXT_MODEL', 'GEMINI_EMBEDDING_MODEL'];
  for (const key of requiredGeminiVars) {
    if (!process.env[key]) {
      throw new Error(`❌ AI_PROVIDER=gemini nécessite la variable d'environnement : ${key}`);
    }
  }
}

if (aiProvider === 'groq' && !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
  throw new Error(`❌ AI_PROVIDER=groq nécessite la variable d'environnement : GROQ_API_KEY`);
}

if (aiProvider === 'ollama' && !process.env.OLLAMA_BASE_URL) {
  throw new Error(`❌ AI_PROVIDER=ollama nécessite la variable d'environnement : OLLAMA_BASE_URL`);
}

export const env = {
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

  // Configuration IA -- lue une seule fois ici, jamais dispersée dans les
  // providers eux-mêmes (voir bonnes pratiques Phase 1 discutées ensemble).
  ai: {
    provider: aiProvider,
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      visionModel: process.env.GEMINI_VISION_MODEL,
      textModel: process.env.GEMINI_TEXT_MODEL,
      embeddingModel: process.env.GEMINI_EMBEDDING_MODEL,
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY,
      textModel: process.env.GROQ_TEXT_MODEL || 'qwen/qwen3.6-27b',
      visionModel: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b',
    },
  },
};