import { ollamaProvider } from './providers/ollama.provider.js';
import { geminiProvider } from './providers/gemini.provider.js';
import { groqProvider } from './providers/groq.provider.js';
import { openrouterProvider } from './providers/openrouter.provider.js';

const providers = {
  ollama: ollamaProvider,
  gemini: geminiProvider,
  groq: groqProvider,
  openrouter: openrouterProvider,
};

// Ordre dans lequel on tente les fournisseurs de secours quand le
// fournisseur principal echoue. Les API cloud d'abord (les plus fiables
// depuis un conteneur Railway), Ollama en dernier car il suppose un
// serveur local joignable.
const FALLBACK_ORDER = ['gemini', 'groq', 'openrouter', 'ollama'];

export function getPrimaryProviderName() {
  return process.env.AI_PROVIDER || 'ollama';
}

/**
 * Retourne l'instance du fournisseur IA actif, selon AI_PROVIDER.
 * env.js a déjà validé au démarrage que cette variable est cohérente,
 * donc aucune vérification supplémentaire nécessaire ici.
 */
export function getAIProvider() {
  return providers[getPrimaryProviderName()];
}

/**
 * Fournisseurs de secours : tous ceux dont la configuration est complète,
 * hors fournisseur principal.
 *
 * Une clé d'API expirée, un modèle inexistant ou une panne côté fournisseur
 * ne doit pas rendre inutilisables les fonctions IA de l'application (les
 * emails, l'extraction de marchés) tant qu'un autre fournisseur est
 * configuré et fonctionnel.
 */
export function getFallbackProviders() {
  const primaryName = getPrimaryProviderName();
  return FALLBACK_ORDER
    .filter((name) => name !== primaryName)
    .map((name) => providers[name])
    .filter((provider) => provider.isConfigured());
}
