/**
 * Détermine si un marché "existe" pour une année donnée : son intervalle
 * [dateDebut, dateFin] chevauche cette année, même partiellement (ex: un
 * marché du 01/09/2025 au 31/08/2026 existe à la fois en 2025 et 2026).
 */
export function yearOverlapsMarche(marche, year) {
  const debut = new Date(marche.dateDebut).getFullYear();
  const fin = new Date(marche.dateFin).getFullYear();
  return debut <= year && fin >= year;
}

/**
 * Calcule la liste des années disponibles à partir des marchés existants,
 * du plus récent au plus ancien. Inclut toujours l'année en cours, même si
 * aucun marché n'y est actif, pour que le sélecteur ne soit jamais vide.
 */
export function computeAvailableYears(marches) {
  const currentYear = new Date().getFullYear();
  if (!marches || marches.length === 0) return [currentYear];

  let min = Infinity;
  let max = -Infinity;
  marches.forEach((m) => {
    const debut = new Date(m.dateDebut).getFullYear();
    const fin = new Date(m.dateFin).getFullYear();
    if (debut < min) min = debut;
    if (fin > max) max = fin;
  });
  max = Math.max(max, currentYear);

  const years = [];
  for (let y = max; y >= min; y--) years.push(y);
  return years;
}