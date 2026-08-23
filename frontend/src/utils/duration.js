/**
 * Conversions et affichage des durées MRT.
 *
 * Le MRT est stocké en MINUTES côté base et côté API (`slaMrt` est un Int,
 * et les KPI calculés sont eux aussi en minutes). Les contrats, eux, sont
 * toujours rédigés en heures ("7 H pour Agadir", "24 H pour Dakhla") : ces
 * helpers font le pont entre les deux, pour que l'interface parle en heures
 * sans jamais changer l'unité de stockage.
 */

/** Minutes -> heures, arrondi à 2 décimales (420 -> 7, 450 -> 7.5). */
export function minutesToHeures(minutes) {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '';
  return Math.round((Number(minutes) / 60) * 100) / 100;
}

/**
 * Heures -> minutes entières. L'arrondi est indispensable : l'API exige un
 * entier (`z.number().int()`), et une saisie comme 7,25 h donnerait sinon
 * 435.00000000000006 à cause des flottants.
 */
export function heuresToMinutes(heures) {
  return Math.round(Number(heures) * 60);
}

/** Minutes -> "7h 30min" (ou "45min" en dessous d'une heure). */
export function formatDuree(minutes) {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}
