/**
 * Contrat commun que chaque fournisseur d'IA (Ollama, Gemini, ...) doit
 * respecter. Ce fichier ne contient aucune logique -- c'est une
 * documentation exécutable du contrat, pas une classe à hériter (le
 * projet est en JavaScript pur, sans TypeScript pour imposer ça au
 * compilateur).
 *
 * Chaque provider doit exporter un objet avec exactement ces trois
 * méthodes, avec ces signatures :
 *
 * @typedef {Object} AIProvider
 *
 * @property {(imageBase64: string, prompt: string) => Promise<string>} transcribeImage
 *   Transcrit le contenu visible d'une image (page scannée) en texte brut.
 *   Doit lancer une erreur explicite en cas d'échec, jamais retourner une
 *   chaîne vide silencieusement.
 *
 * @property {(prompt: string) => Promise<object>} structureText
 *   Structure un texte libre en objet JSON, selon les instructions du
 *   prompt fourni. Doit retourner un objet JavaScript déjà parsé (pas une
 *   chaîne), et gérer elle-même la réparation d'un JSON mal formé si le
 *   modèle sous-jacent le permet.
 *
 * @property {(text: string) => Promise<number[]>} embed
 *   Retourne le vecteur d'embedding d'un texte donné, pour la recherche
 *   sémantique (utilisé par le chatbot RAG, phase suivante).
 */

// Ce fichier n'exporte rien d'exécutable -- il documente uniquement le
// contrat ci-dessus, importé par convention (JSDoc) dans chaque provider.
export {};