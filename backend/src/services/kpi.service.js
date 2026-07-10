import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

async function getMarcheInTenant(marcheId, tenantFilter) {
  const marche = await prisma.marche.findFirst({ where: { id: marcheId, ...tenantFilter } });
  if (!marche) throw new AppError(404, 'Marché introuvable', 'NOT_FOUND');
  return marche;
}

function daysBetween(dateDebut, dateFin) {
  const ms = new Date(dateFin) - new Date(dateDebut);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function computePRR(equipementIds, dateDebut, dateFin) {
  const interventions = await prisma.interventionPreventive.findMany({
    where: {
      equipementId: { in: equipementIds },
      mois: { gte: new Date(dateDebut), lte: new Date(dateFin) },
      statutValidation: 'VALIDE',
    },
  });
  const totalPlanifiees = interventions.reduce((sum, i) => sum + i.nbInterventionsPlanifiees, 0);
  const totalRealisees = interventions.reduce((sum, i) => sum + i.nbInterventionsRealisees, 0);
  if (totalPlanifiees === 0) return null;
  return round2((totalRealisees / totalPlanifiees) * 100);
}

async function computeDisponibilite(equipements, dateDebut, dateFin) {
  if (equipements.length === 0) return null;
  const nbJours = daysBetween(dateDebut, dateFin);
  let sommeDisponibilites = 0;

  for (const equipement of equipements) {
    const heuresParJour = Number(equipement.heuresFonctionnementJour);
    const tempsTotalMinutes = nbJours * heuresParJour * 60;

    const pannes = await prisma.panne.findMany({
      where: {
        equipementId: equipement.id,
        tPanne: { gte: new Date(dateDebut), lte: new Date(dateFin) },
        dureeArretMinutes: { not: null },
      },
    });
    const tempsArretMinutes = pannes.reduce((sum, p) => sum + (p.dureeArretMinutes || 0), 0);

    const disponibilite = tempsTotalMinutes > 0
      ? ((tempsTotalMinutes - tempsArretMinutes) / tempsTotalMinutes) * 100
      : 100;

    sommeDisponibilites += Math.max(0, disponibilite);
  }

  return round2(sommeDisponibilites / equipements.length);
}

async function computeMRT(equipementIds, dateDebut, dateFin) {
  const reclamations = await prisma.reclamation.findMany({
    where: {
      panne: { equipementId: { in: equipementIds } },
      tNotification: { gte: new Date(dateDebut), lte: new Date(dateFin) },
      tempsReactionMinutes: { not: null },
    },
  });
  if (reclamations.length === 0) return null;
  const total = reclamations.reduce((sum, r) => sum + r.tempsReactionMinutes, 0);
  return round2(total / reclamations.length);
}

export async function getKpiSummary(marcheId, dateDebut, dateFin, tenantFilter) {
  const marche = await getMarcheInTenant(marcheId, tenantFilter);
  const equipements = await prisma.equipement.findMany({ where: { marcheId } });
  const equipementIds = equipements.map((e) => e.id);

  const [prr, disponibilite, mrt] = await Promise.all([
    computePRR(equipementIds, dateDebut, dateFin),
    computeDisponibilite(equipements, dateDebut, dateFin),
    computeMRT(equipementIds, dateDebut, dateFin),
  ]);

  return {
    marche: { id: marche.id, numeroMarche: marche.numeroMarche, objet: marche.objet },
    periode: { dateDebut, dateFin },
    kpi: {
      prr: {
        valeur: prr,
        seuil: Number(marche.slaPrr),
        conforme: prr !== null ? prr >= Number(marche.slaPrr) : null,
      },
      disponibilite: {
        valeur: disponibilite,
        seuil: Number(marche.slaDisponibilite),
        conforme: disponibilite !== null ? disponibilite >= Number(marche.slaDisponibilite) : null,
      },
      mrt: {
        valeur: mrt,
        seuil: marche.slaMrt,
        conforme: mrt !== null ? mrt <= marche.slaMrt : null,
      },
    },
  };
}