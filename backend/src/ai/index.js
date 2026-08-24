import { getAIProvider, getFallbackProviders, getPrimaryProviderName } from './aiProviderFactory.js';
import { logger } from '../utils/logger.js';

// Instance unique, résolue une seule fois au chargement du module -- le
// reste de l'application importe `aiService`, jamais le factory
// directement, pour ne jamais avoir à connaître le mécanisme de sélection.
const primaryProvider = getAIProvider();
const fallbackProviders = getFallbackProviders();

logger.info(
  `🤖 [ai] Fournisseur principal : ${getPrimaryProviderName()}`
  + (fallbackProviders.length
    ? ` (secours : ${fallbackProviders.map((p) => p.name).join(', ')})`
    : ' (aucun fournisseur de secours configuré)')
);

/**
 * Appelle `method` sur le fournisseur principal, et bascule sur les
 * fournisseurs de secours configurés si celui-ci échoue.
 *
 * Un modèle mal orthographié dans les variables d'environnement, une clé
 * expirée ou une indisponibilité du fournisseur ne doivent pas rendre une
 * fonctionnalité entière (génération d'email, extraction) inutilisable :
 * on bascule, on trace, et on ne remonte l'erreur que si TOUS les
 * fournisseurs disponibles ont échoué.
 */
async function withFallback(method, args) {
  const chain = [primaryProvider, ...fallbackProviders];
  let lastError;

  for (const provider of chain) {
    try {
      return await provider[method](...args);
    } catch (err) {
      lastError = err;
      logger.warn(`⚠️  [ai] ${provider.name}.${method}() a échoué : ${err.message}`);
    }
  }

  throw new Error(
    `Aucun fournisseur IA n'a pu traiter la demande (${chain.map((p) => p.name).join(' → ')}). `
    + `Dernière erreur : ${lastError?.message}`
  );
}

/** @type {import('./AIProvider.interface.js').AIProvider} */
export const aiService = {
  transcribeImage: (...args) => withFallback('transcribeImage', args),
  structureText: (...args) => withFallback('structureText', args),
  embed: (...args) => withFallback('embed', args),
  recommendedConcurrency: primaryProvider.recommendedConcurrency,
};
