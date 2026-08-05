/**
 * Exécute `items` avec `worker` en respectant une limite de concurrence.
 * Implémentation minimale, sans dépendance externe (évite d'ajouter une
 * librairie comme p-limit pour une poignée de lignes) -- suffisant pour
 * notre besoin : limiter les appels IA simultanés pour respecter les
 * quotas (Ollama local comme Gemini gratuit, 15 requêtes/minute).
 *
 * @template T, R
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} worker
 * @returns {Promise<R[]>}
 */
export async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runNext() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, runNext);
  await Promise.all(runners);
  return results;
}