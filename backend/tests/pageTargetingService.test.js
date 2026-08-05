import { describe, it, expect } from 'vitest';
import { parseTableOfMatieres, computeTargetedPages, refineViaTableOfMatieres } from '../src/services/pageTargetingService.js';

// Texte réel (reconstitué à partir de l'OCR manuel qu'on a fait sur
// 027-HTDS.pdf en tout début de projet) -- preuve que le parsing
// fonctionne sur un vrai document ONDA, pas un exemple inventé.
const TOC_REELLE_027_HTDS = `
TABLE DES MATIERES
ARTICLE 01 : OBJET DU MARCHE________________________5
ARTICLE 19 : GARANTIE PARTICULIERE__________________8
ARTICLE 20 : DUREE DU MARCHE________________________9
ARTICLE 24 : PENALITES______________________________10
ARTICLE 30 : SPECIFICATION DU NIVEAU DE SERVICE_____12
ARTICLE 31 : OBJECTIFS DU NIVEAU DE SERVICE_________14
ARTICLE 34 : MAINTENANCE PREVENTIVE_________________16
ARTICLE 35 : MAINTENANCE CORRECTIVE_________________20
PARTIE II : BORDEREAU DES PRIX – DETAIL ESTIMATIF (BDP-DE) – LOT 2________28
`;

describe('parseTableOfMatieres', () => {
  it('extrait les couples (titre, page) depuis un texte de table des matières réel', () => {
    const entries = parseTableOfMatieres(TOC_REELLE_027_HTDS);

    expect(entries.length).toBeGreaterThanOrEqual(8);
    expect(entries).toContainEqual({ titre: 'ARTICLE 30 : SPECIFICATION DU NIVEAU DE SERVICE', page: 12 });
    expect(entries).toContainEqual({ titre: 'ARTICLE 31 : OBJECTIFS DU NIVEAU DE SERVICE', page: 14 });
  });

  it('retourne un tableau vide sur un texte sans table des matières', () => {
    expect(parseTableOfMatieres('Ceci est un texte quelconque sans structure.')).toEqual([]);
  });
});

describe('computeTargetedPages', () => {
  it('cible bien les pages 12 à 15 pour les articles SLA (12 et 14), et 28 pour le BDP', () => {
    const entries = parseTableOfMatieres(TOC_REELLE_027_HTDS);
    const targeted = computeTargetedPages(entries);

    expect(targeted).toContain(1);   // couverture
    expect(targeted).toContain(12);  // ARTICLE 30 (niveau de service)
    expect(targeted).toContain(14);  // ARTICLE 31 (objectifs niveau de service)
    expect(targeted).toContain(28);  // Bordereau des prix (montant)
    expect(targeted.length).toBeLessThanOrEqual(10);
  });
});

describe('refineViaTableOfMatieres', () => {
  it('retourne null si aucune table des matières n\'est présente dans les pages fournies', () => {
    const earlyPages = [{ pageNumber: 1, isNative: true, text: 'Marché N° 027/2024, contrat quelconque' }];
    const result = refineViaTableOfMatieres(earlyPages, [1, 2, 3, 4, 5]);
    expect(result).toBeNull();
  });

  it('affine la sélection quand une table des matières réelle est présente', () => {
    const earlyPages = [
      { pageNumber: 1, isNative: true, text: 'Marché N° 027/2024' },
      { pageNumber: 2, isNative: true, text: TOC_REELLE_027_HTDS },
    ];
    const result = refineViaTableOfMatieres(earlyPages, Array.from({ length: 15 }, (_, i) => i + 1));

    expect(result).not.toBeNull();
    expect(result.length).toBeLessThan(15); // preuve que le ciblage réduit vraiment le nombre de pages
    expect(result).toContain(12);
    expect(result).toContain(14);
  });
});