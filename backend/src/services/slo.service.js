import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { computePRR, computeDisponibilite, computeMRT } from './kpi.service.js';

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

/**
 * Convertit une période ('all' | 'T1'-'T4' | '01'-'12') + année en bornes
 * de dates calendaires. Logique identique à periodToDateRange() du
 * composant frontend PeriodFilter.jsx -- volontairement dupliquée plutôt
 * que partagée entre front/back (les deux runtimes sont séparés), mais
 * les deux DOIVENT rester en synchronisation si l'une est modifiée.
 */
function periodToDateRange(period, year) {
  if (period === 'all') return { dateDebut: `${year}-01-01`, dateFin: `${year}-12-31` };
  if (period.startsWith('T')) {
    const q = parseInt(period.substring(1), 10);
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const lastDay = new Date(year, endMonth, 0).getDate();
    return {
      dateDebut: `${year}-${String(startMonth).padStart(2, '0')}-01`,
      dateFin: `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }
  const lastDay = new Date(year, parseInt(period, 10), 0).getDate();
  return { dateDebut: `${year}-${period}-01`, dateFin: `${year}-${period}-${String(lastDay).padStart(2, '0')}` };
}

async function getSocieteInTenant(societeId, tenantFilter) {
  const societe = await prisma.societe.findFirst({ where: { id: societeId, ...tenantFilter, deletedAt: null } });
  if (!societe) throw new AppError(404, 'Société introuvable', 'NOT_FOUND');
  return societe;
}

async function getMarcheInTenant(marcheId, tenantFilter) {
  const marche = await prisma.marche.findFirst({ where: { id: marcheId, ...tenantFilter, deletedAt: null } });
  if (!marche) throw new AppError(404, 'Marché introuvable', 'NOT_FOUND');
  return marche;
}

/**
 * Retourne la configuration SLO d'une société -- celle enregistrée si elle
 * existe, sinon des valeurs par défaut dérivées du SLA du marché.
 */
export async function getConfig(societeId, tenantFilter) {
  const societe = await getSocieteInTenant(societeId, tenantFilter);

  const existing = await prisma.sloConfig.findFirst({ where: { societeId, ...tenantFilter } });
  if (existing) return existing;

  const marche = await prisma.marche.findUnique({ where: { id: societe.marcheId } });
  return {
    societeId,
    marcheId: societe.marcheId,
    seuilPrr: marche ? Number(marche.slaPrr) : 90,
    coefPrr: 1,
    seuilMrtHeures: marche ? marche.slaMrt / 60 : 1,
    coefMrt: 1,
    seuilDispo: marche ? Number(marche.slaDisponibilite) : 98,
    coefDispo: 1,
  };
}

/**
 * Crée ou met à jour la configuration SLO d'une société. Le marché est
 * TOUJOURS dérivé de la société elle-même (jamais fourni par le client).
 */
export async function saveConfig(data, tenantFilter) {
  const societe = await getSocieteInTenant(data.societeId, tenantFilter);

  return prisma.sloConfig.upsert({
    where: { societeId: data.societeId },
    update: {
      seuilPrr: data.seuilPrr,
      coefPrr: data.coefPrr,
      seuilMrtHeures: data.seuilMrtHeures,
      coefMrt: data.coefMrt,
      seuilDispo: data.seuilDispo,
      coefDispo: data.coefDispo,
    },
    create: {
      airportId: societe.airportId,
      societeId: societe.id,
      marcheId: societe.marcheId,
      seuilPrr: data.seuilPrr,
      coefPrr: data.coefPrr,
      seuilMrtHeures: data.seuilMrtHeures,
      coefMrt: data.coefMrt,
      seuilDispo: data.seuilDispo,
      coefDispo: data.coefDispo,
    },
  });
}

/**
 * Calcule l'analyse SLO complète pour un marché + société + période donnés.
 *  - Indice PRR/Disponibilité : 1.0 si le réel >= seuil, sinon réel/seuil.
 *  - Indice MRT : 1.0 SAUF si le réel dépasse strictement le seuil, auquel
 *    cas l'indice devient seuil/réel.
 *  - SLO global = moyenne des indices pondérée par les coefficients.
 */
export async function computeAnalysis(marcheId, societeId, period, year, tenantFilter) {
  const marche = await getMarcheInTenant(marcheId, tenantFilter);
  const societe = await getSocieteInTenant(societeId, tenantFilter);

  if (societe.marcheId !== marche.id) {
    throw new AppError(400, 'Cette société n\'appartient pas à ce marché', 'INVALID_REFERENCE');
  }

  const config = await getConfig(societeId, tenantFilter);
  const { dateDebut, dateFin } = periodToDateRange(period, year);

  const equipements = await prisma.equipement.findMany({
    where: { marcheId, societeId, deletedAt: null },
  });
  const equipementIds = equipements.map((e) => e.id);

  const [realPrr, realDispo, realMrt] = await Promise.all([
    computePRR(equipementIds, dateDebut, dateFin),
    computeDisponibilite(equipements, dateDebut, dateFin),
    computeMRT(equipementIds, dateDebut, dateFin),
  ]);

  const seuilPrr = Number(config.seuilPrr);
  const coefPrr = Number(config.coefPrr);
  const seuilMrtHeures = Number(config.seuilMrtHeures);
  const seuilMrtMinutes = seuilMrtHeures * 60;
  const coefMrt = Number(config.coefMrt);
  const seuilDispo = Number(config.seuilDispo);
  const coefDispo = Number(config.coefDispo);
  const totalCoefs = coefPrr + coefMrt + coefDispo;

  if (totalCoefs === 0) {
    throw new AppError(400, 'La somme des coefficients doit être supérieure à 0', 'INVALID_CONFIG');
  }

  const indicePrr = realPrr === null ? 1.0 : (realPrr >= seuilPrr ? 1.0 : realPrr / seuilPrr);
  const indiceMrt = realMrt === null ? 1.0 : (realMrt > seuilMrtMinutes ? seuilMrtMinutes / realMrt : 1.0);
  const indiceDispo = realDispo === null ? 1.0 : (realDispo >= seuilDispo ? 1.0 : realDispo / seuilDispo);

  const globalIndex = (indicePrr * coefPrr + indiceMrt * coefMrt + indiceDispo * coefDispo) / totalCoefs;

  return {
    marche: { id: marche.id, numeroMarche: marche.numeroMarche },
    societe: { id: societe.id, raisonSociale: societe.raisonSociale },
    periode: { period, year, dateDebut, dateFin },
    config: {
      seuilPrr, coefPrr, seuilMrtHeures, seuilMrtMinutes, coefMrt, seuilDispo, coefDispo,
    },
    global: {
      indice: round3(globalIndex),
      pourcentage: round3(globalIndex * 100),
    },
    prr: { reel: realPrr, seuil: seuilPrr, indice: round3(indicePrr), conforme: realPrr === null ? null : realPrr >= seuilPrr },
    mrt: { reelMinutes: realMrt, seuilMinutes: seuilMrtMinutes, indice: round3(indiceMrt), conforme: realMrt === null ? null : realMrt <= seuilMrtMinutes },
    disponibilite: { reel: realDispo, seuil: seuilDispo, indice: round3(indiceDispo), conforme: realDispo === null ? null : realDispo >= seuilDispo },
  };
}