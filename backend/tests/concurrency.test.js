import { describe, it, expect } from 'vitest';
import { mapWithConcurrency } from '../src/utils/concurrency.js';

describe('mapWithConcurrency', () => {
  it('traite tous les éléments et retourne les résultats dans le bon ordre', async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await mapWithConcurrency(items, 2, async (n) => n * 10);
    expect(results).toEqual([10, 20, 30, 40, 50]);
  });

  it('ne dépasse jamais la limite de concurrence fixée', async () => {
    let current = 0;
    let max = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);

    await mapWithConcurrency(items, 3, async () => {
      current++;
      max = Math.max(max, current);
      await new Promise((r) => setTimeout(r, 10));
      current--;
    });

    expect(max).toBeLessThanOrEqual(3);
  });

  it('propage une erreur si un worker échoue', async () => {
    const items = [1, 2, 3];
    await expect(
      mapWithConcurrency(items, 2, async (n) => {
        if (n === 2) throw new Error('échec volontaire');
        return n;
      })
    ).rejects.toThrow('échec volontaire');
  });
});