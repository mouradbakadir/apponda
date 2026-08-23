import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDuree } from './duration.js';

export function exportKpiToPdf(kpi) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Rapport KPI — Amnt ONDA', 14, 20);
  doc.setFontSize(11);
  doc.text(`Marché : ${kpi.marche.numeroMarche} — ${kpi.marche.objet}`, 14, 30);
  doc.text(`Période : ${kpi.periode.dateDebut} au ${kpi.periode.dateFin}`, 14, 37);

  autoTable(doc, {
    startY: 45,
    head: [['Indicateur', 'Valeur', 'Seuil', 'Conforme']],
    body: [
      ['PRR', `${kpi.kpi.prr.valeur ?? '—'}%`, `${kpi.kpi.prr.seuil}%`, kpi.kpi.prr.conforme ? 'Oui' : 'Non'],
      ['Disponibilité', `${kpi.kpi.disponibilite.valeur ?? '—'}%`, `${kpi.kpi.disponibilite.seuil}%`, kpi.kpi.disponibilite.conforme ? 'Oui' : 'Non'],
      ['MRT', formatDuree(kpi.kpi.mrt.valeur), formatDuree(kpi.kpi.mrt.seuil), kpi.kpi.mrt.conforme ? 'Oui' : 'Non'],
    ],
  });

  doc.save(`rapport-kpi-${kpi.marche.numeroMarche}.pdf`);
}