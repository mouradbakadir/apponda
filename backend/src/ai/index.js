import { getAIProvider } from './aiProviderFactory.js';

// Instance unique, résolue une seule fois au chargement du module -- le
// reste de l'application importe `aiService`, jamais le factory
// directement, pour ne jamais avoir à connaître le mécanisme de sélection.
export const aiService = getAIProvider();