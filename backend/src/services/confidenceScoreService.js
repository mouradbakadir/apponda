// Champs critiques = ceux qui sont REQUIS (non-nullable) dans createMarcheSchema,
// donc ceux que l'humain devra de toute façon remplir si l'IA les a manqués.
const CRITICAL_FIELDS = ['numeroMarche', 'objet', 'typeMaintenance', 'slaDisponibilite', 'slaPrr', 'slaMrt', 'dateDebut', 'dateFin'];

export function calculateConfidenceScore(extractedData, { airportMentioned = true } = {}) {
  if (!extractedData) return 0;

  const filledCount = CRITICAL_FIELDS.filter((field) => {
    const value = extractedData[field];
    return value !== null && value !== undefined && value !== '';
  }).length;

  let score = (filledCount / CRITICAL_FIELDS.length) * 100;

  // Garde-fou spécifique au piège "7 H" vs "420 minutes" : un MRT extrait
  // à une valeur ridiculement basse (ex: 7 au lieu de 420) trahit presque
  // toujours un oubli de conversion heures->minutes par le modèle.
  if (extractedData.slaMrt != null && extractedData.slaMrt < 60) {
    score -= 20;
  }

  if (!airportMentioned) {
    score -= 40;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}