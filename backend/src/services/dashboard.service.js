import { prisma } from '../config/prisma.js';
import { computePRR, computeDisponibilite, computeMRT } from './kpi.service.js';

function resolvePeriodToDateRange(period, year) {
  if (!period || period === 'all') {
    return { dateDebut: `${year}-01-01`, dateFin: `${year}-12-31` };
  }
  if (period.startsWith('T')) {
    const q = parseInt(period.replace('T', ''), 10);
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

/**
 * Agrège toutes les données du tableau de bord en un seul appel.
 *
 * CHANGEMENT IMPORTANT : contrairement à la version initiale (fidèle à la
 * maquette de référence), TOUTES les sections ci-dessous respectent
 * désormais Année + Période + Société -- y compris les Réclamations
 * Actives, les Alertes de retard, et les listes "Dernières Pannes /
 * Réclamations", qui étaient volontairement globales à l'origine. Ce
 * changement a été demandé explicitement : l'utilisateur veut que
 * l'intégralité de la page réagisse aux trois filtres, sans exception.
 */
export async function getDashboardSummary(tenantFilter, { period, societeId, year }) {
  const resolvedYear = year || new Date().getFullYear();
  const { dateDebut, dateFin } = resolvePeriodToDateRange(period, resolvedYear);
  const societeFilter = societeId && societeId !== 'all' ? { societeId } : {};

  const equipements = await prisma.equipement.findMany({
    where: { ...tenantFilter, ...societeFilter, deletedAt: null },
  });
  const equipementIds = equipements.map((e) => e.id);

  const [prr, disponibilite, mrt] = await Promise.all([
    computePRR(equipementIds, dateDebut, dateFin),
    computeDisponibilite(equipements, dateDebut, dateFin),
    computeMRT(equipementIds, dateDebut, dateFin),
  ]);

  const pannesCount = await prisma.panne.count({
    where: {
      ...tenantFilter,
      deletedAt: null,
      tPanne: { gte: new Date(dateDebut), lte: new Date(dateFin) },
      equipementId: { in: equipementIds },
    },
  });

  const visitesPeriode = await prisma.preventifVisite.findMany({
    where: {
      ...tenantFilter,
      ...societeFilter,
      deletedAt: null,
      datePlanifiee: { gte: new Date(dateDebut), lte: new Date(dateFin) },
    },
  });
  const preventifTotal = visitesPeriode.length;
  const preventifDone = visitesPeriode.filter((v) => v.statut === 'REALISEE').length;

  // Réclamations actives -- maintenant bornées par la période (tNotification)
  // et par la société choisie (via la chaîne Reclamation -> Panne -> Équipement).
  const reclamationsActives = await prisma.reclamation.count({
    where: {
      ...tenantFilter,
      deletedAt: null,
      statut: { in: ['NOUVELLE', 'EN_COURS'] },
      tNotification: { gte: new Date(dateDebut), lte: new Date(dateFin) },
      panne: { equipementId: { in: equipementIds } },
    },
  });

  // Alertes de retard -- bornées par la période ET par "aujourd'hui" (une
  // intervention prévue dans le futur, même à l'intérieur de la période
  // choisie, n'est pas encore "en retard").
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const alertUpperBound = new Date(Math.min(new Date(dateFin).getTime(), today.getTime()));

  const visitesEnRetard = await prisma.preventifVisite.findMany({
    where: {
      ...tenantFilter,
      ...societeFilter,
      deletedAt: null,
      statut: 'PLANIFIEE',
      datePlanifiee: { gte: new Date(dateDebut), lte: alertUpperBound },
    },
    include: { societe: true },
    orderBy: { datePlanifiee: 'asc' },
  });

  const alertes = visitesEnRetard.map((v) => ({
    id: v.id,
    titre: v.titre,
    societeNom: v.societe.raisonSociale,
    datePlanifiee: v.datePlanifiee,
    joursRetard: Math.floor((today - new Date(v.datePlanifiee)) / (1000 * 60 * 60 * 24)),
  }));

  let compliantCount = 0;
  let nonCompliantCount = 0;
  for (const v of visitesPeriode) {
    if (v.statut === 'REALISEE' && v.dateRealisee && v.dateRealisee <= v.datePlanifiee) {
      compliantCount++;
    } else {
      nonCompliantCount++;
    }
  }
  const totalSlo = compliantCount + nonCompliantCount;
  const sloPercent = totalSlo > 0 ? Math.round((compliantCount / totalSlo) * 100) : 100;

  // Dernières pannes / réclamations -- désormais bornées par la période ET
  // la société choisie (auparavant globales, sans aucun filtre).
  const recentPannesRaw = await prisma.panne.findMany({
    where: {
      ...tenantFilter,
      deletedAt: null,
      tPanne: { gte: new Date(dateDebut), lte: new Date(dateFin) },
      equipementId: { in: equipementIds },
    },
    include: { equipement: true },
    orderBy: { tPanne: 'desc' },
    take: 5,
  });

  const recentReclamationsRaw = await prisma.reclamation.findMany({
    where: {
      ...tenantFilter,
      deletedAt: null,
      tNotification: { gte: new Date(dateDebut), lte: new Date(dateFin) },
      panne: { equipementId: { in: equipementIds } },
    },
    orderBy: { tNotification: 'desc' },
    take: 5,
  });

  return {
    periode: { dateDebut, dateFin },
    kpi: {
      prr, mrt, disponibilite,
      pannesCount,
      preventifDone, preventifTotal,
      reclamationsActives,
    },
    alertes,
    slo: { compliantCount, nonCompliantCount, totalSlo, sloPercent },
    recentPannes: recentPannesRaw.map((p) => ({
      id: p.id,
      equipementDesignation: p.equipement.designation,
      tPanne: p.tPanne,
      statut: p.statut,
    })),
    recentReclamations: recentReclamationsRaw.map((r) => ({
      id: r.id,
      objet: r.objet,
      tNotification: r.tNotification,
      statut: r.statut,
    })),
  };
}