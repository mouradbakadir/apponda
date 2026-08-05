import { ollamaProvider } from './providers/ollama.provider.js';
import { geminiProvider } from './providers/gemini.provider.js';

const providers = {
  ollama: ollamaProvider,
  gemini: geminiProvider,
};

/**
 * Retourne l'instance du fournisseur IA actif, selon AI_PROVIDER.
 * env.js a déjà validé au démarrage que cette variable est cohérente,
 * donc aucune vérification supplémentaire nécessaire ici.
 */
export function getAIProvider() {
  const providerName = process.env.AI_PROVIDER || 'ollama';
  return providers[providerName];
}