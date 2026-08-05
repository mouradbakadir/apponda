import { useState, useEffect } from 'react';
import { marchesApi } from '../services/marches.api.js';
import { societesApi } from '../services/societes.api.js';
import { pannesApi } from '../services/pannes.api.js';
import { equipementsApi } from '../services/equipements.api.js';
import { kpiApi } from '../services/kpi.api.js';
import { useAirport } from '../context/AirportContext.jsx';
import { FileTextIcon, FileSpreadsheetIcon } from '../components/icons.jsx';
import PeriodFilter, { periodToDateRange, periodLabel } from '../components/PeriodFilter.jsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '-';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
}

/**
 * Charge une image (ex: le logo ONDA depuis /public) et la convertit en
 * base64, format requis par jsPDF pour l'intégrer dans un PDF généré côté
 * client. Si le logo est introuvable, l'export continue sans bloquer --
 * mieux vaut un rapport sans logo qu'un export qui plante.
 */
async function loadImageAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Logo introuvable');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function RapportsPage() {
  const { airports, selectedAirportId } = useAirport();
  const [marches, setMarches] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [pannes, setPannes] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState('all');
  const [marcheFilter, setMarcheFilter] = useState('all');
  const [societeFilter, setSocieteFilter] = useState('all'); // stocke le NOM de la societe, pas un id
  const [rows, setRows] = useState(null);
  const [emptyReason, setEmptyReason] = useState(null); // 'no-filter' | 'no-period' | null
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    marchesApi.getAll().then((res) => setMarches(res.data || res));
    societesApi.getAll().then((res) => setSocietes(res.data || res));
    pannesApi.getAll().then((res) => setPannes(res.data || res));
    equipementsApi.getAll().then((res) => setEquipements(res.data || res));
  }, []);

  const societeNames = Array.from(new Set(societes.map((s) => s.raisonSociale))).sort();

  useEffect(() => {
    generateDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, period, marcheFilter, societeFilter, marches.length]);

  function marcheExistePourPeriode(marche, y, p) {
    const { dateDebut, dateFin } = periodToDateRange(y, p);
    const periodStart = new Date(dateDebut);
    const periodEnd = new Date(dateFin);
    const marcheStart = new Date(marche.dateDebut);
    const marcheEnd = new Date(marche.dateFin);
    return marcheStart <= periodEnd && marcheEnd >= periodStart;
  }

  function targetMarches() {
    if (societeFilter !== 'all') {
      const marcheIds = new Set(
        societes.filter((s) => s.raisonSociale === societeFilter).map((s) => s.marcheId)
      );
      return marches.filter((m) => marcheIds.has(m.id));
    }
    if (marcheFilter !== 'all') return marches.filter((m) => m.id === marcheFilter);
    return marches;
  }

  function handleMarcheChange(e) {
    const value = e.target.value;
    setMarcheFilter(value);
    if (value === 'all') {
      setSocieteFilter('all');
      return;
    }
    const societesDuMarche = societes.filter((s) => s.marcheId === value);
    const noms = Array.from(new Set(societesDuMarche.map((s) => s.raisonSociale)));
    setSocieteFilter(noms.length === 1 ? noms[0] : 'all');
  }

  function handleSocieteChange(e) {
    const value = e.target.value;
    setSocieteFilter(value);
    if (value === 'all') {
      setMarcheFilter('all');
      return;
    }
    const marcheIdsDeCetteSociete = Array.from(
      new Set(societes.filter((s) => s.raisonSociale === value).map((s) => s.marcheId))
    );
    setMarcheFilter(marcheIdsDeCetteSociete.length === 1 ? marcheIdsDeCetteSociete[0] : 'all');
  }

  function handleYearChange(newYear) {
    setYear(newYear);
  }

  function handleYearBlur(e) {
    const num = Number(e.target.value);
    if (Number.isNaN(num) || num < 2000 || num > 2100) {
      setYear(new Date().getFullYear());
    }
  }

  async function generateDashboard() {
    if (marches.length === 0) return;
    setLoading(true);
    const { dateDebut, dateFin } = periodToDateRange(year, period);

    const scopeParFiltres = targetMarches();
    if (scopeParFiltres.length === 0) {
      setRows([]);
      setEmptyReason('no-filter');
      setLoading(false);
      return;
    }

    const scope = scopeParFiltres.filter((m) => marcheExistePourPeriode(m, year, period));
    if (scope.length === 0) {
      setRows([]);
      setEmptyReason('no-period');
      setLoading(false);
      return;
    }

    const results = await Promise.all(
      scope.map((m) =>
        kpiApi.getSummary(m.id, dateDebut, dateFin)
          .then((res) => ({ marche: m, kpi: res.kpi }))
          .catch(() => ({ marche: m, kpi: null }))
      )
    );
    setRows(results.filter((r) => r.kpi !== null));
    setEmptyReason(null);
    setLoading(false);
  }

  function countPannes() {
    const scope = targetMarches();
    const equipementIds = new Set(equipements.filter((e) => scope.some((m) => m.id === e.marcheId)).map((e) => e.id));
    const { dateDebut, dateFin } = periodToDateRange(year, period);
    return pannes.filter((p) => {
      if (!equipementIds.has(p.equipementId)) return false;
      const d = new Date(p.tPanne);
      return d >= new Date(dateDebut) && d <= new Date(dateFin + 'T23:59:59');
    }).length;
  }

  function average(values) {
    const valid = values.filter((v) => v !== null && v !== undefined);
    if (valid.length === 0) return null;
    return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100;
  }

  const globalPrr = rows ? average(rows.map((r) => r.kpi.prr.valeur)) : null;
  const globalMrt = rows ? average(rows.map((r) => r.kpi.mrt.valeur)) : null;
  const globalDispo = rows ? average(rows.map((r) => r.kpi.disponibilite.valeur)) : null;
  const globalPannes = rows ? countPannes() : 0;

  // --- Titre et colonnes dynamiques, partagés entre l'écran, le PDF et Excel ---

  const selectedAirport = selectedAirportId !== 'all' ? airports.find((a) => a.id === selectedAirportId) : null;

  // Colonne "Aéroport" affichée UNIQUEMENT en vue nationale (SUPER_ADMIN,
  // "Tous les aéroports") -- sinon tous les marchés affichés appartiennent
  // déjà au même aéroport, la colonne serait redondante.
  const showAirportColumn = selectedAirportId === 'all';
  // Colonne "Société" affichée UNIQUEMENT quand le rapport est "global"
  // (aucun filtre société précis) -- sinon le nom de la société est déjà
  // dans le titre, la colonne serait redondante.
  const showSocieteColumn = societeFilter === 'all';

  let reportTitle = `Performances par Marché — ${periodLabel(year, period)}`;
  if (selectedAirport) reportTitle += ` — ${selectedAirport.nom}`;
  if (societeFilter !== 'all') reportTitle += ` — ${societeFilter}`;

  function airportNameForMarche(marche) {
    const airport = airports.find((a) => a.id === marche.airportId);
    return airport ? airport.nom : '-';
  }

  function societeNamesForMarche(marcheId) {
    const noms = societes.filter((s) => s.marcheId === marcheId).map((s) => s.raisonSociale);
    return noms.length > 0 ? noms.join(', ') : '-';
  }

  async function exportPdf() {
    if (!rows || rows.length === 0) return alert('Aucune donnée à exporter.');
    setExportingPdf(true);
    try {
      const doc = new jsPDF();

      // Logo ONDA en haut à gauche -- si le fichier est introuvable, on
      // continue sans logo plutôt que de bloquer tout l'export.
      let logoLoaded = false;
      try {
        const logoBase64 = await loadImageAsBase64('/logo.png');
        doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20);
        logoLoaded = true;
      } catch {
        // pas de logo disponible, export sans
      }

      const textX = logoLoaded ? 40 : 14;

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('OFFICE NATIONAL DES AÉROPORTS', textX, 16);

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(reportTitle, textX, 24, { maxWidth: 155 });

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 34, 196, 34);

      const head = ['Marché'];
      if (showAirportColumn) head.push('Aéroport');
      if (showSocieteColumn) head.push('Société');
      head.push('PRR', 'MRT', 'Disponibilité');

      const tableData = rows.map((r) => {
        const row = [r.marche.numeroMarche];
        if (showAirportColumn) row.push(airportNameForMarche(r.marche));
        if (showSocieteColumn) row.push(societeNamesForMarche(r.marche.id));
        row.push(
          r.kpi.prr.valeur !== null ? `${r.kpi.prr.valeur} %` : '-',
          r.kpi.mrt.valeur !== null ? formatDuration(r.kpi.mrt.valeur) : '-',
          r.kpi.disponibilite.valeur !== null ? `${r.kpi.disponibilite.valeur} %` : '-'
        );
        return row;
      });

      autoTable(doc, {
        startY: 40,
        headStyles: { fillColor: [79, 70, 229] },
        head: [head],
        body: tableData,
        theme: 'grid',
      });

      const finalY = doc.lastAutoTable.finalY || 40;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — Amnt, Gestion de la Maintenance ONDA`, 14, finalY + 10);

      const safeTitle = reportTitle.replace(/[^a-zA-Z0-9]+/g, '_');
      doc.save(`${safeTitle}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  }

  function exportExcel() {
    if (!rows || rows.length === 0) return alert('Aucune donnée à exporter.');
    const data = rows.map((r) => {
      const row = { Marché: r.marche.numeroMarche };
      if (showAirportColumn) row['Aéroport'] = airportNameForMarche(r.marche);
      if (showSocieteColumn) row['Société'] = societeNamesForMarche(r.marche.id);
      row['PRR (%)'] = r.kpi.prr.valeur;
      row['MRT'] = r.kpi.mrt.valeur !== null ? formatDuration(r.kpi.mrt.valeur) : '-';
      row['Disponibilité (%)'] = r.kpi.disponibilite.valeur;
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport');
    const safeTitle = reportTitle.replace(/[^a-zA-Z0-9]+/g, '_');
    XLSX.writeFile(workbook, `${safeTitle}.xlsx`);
  }

  const noDataAtAll = !rows || rows.length === 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Rapports & Analytiques</h1>
          <p className="mb-0">Vue consolidée des performances de maintenance et KPIs</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={exportPdf} disabled={exportingPdf}>
            <FileTextIcon size={15} />
            {exportingPdf ? 'Génération...' : 'Export PDF'}
          </button>
          <button className="btn btn-secondary" onClick={exportExcel}>
            <FileSpreadsheetIcon size={15} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="card mb-6" style={{ padding: '0.875rem 1.25rem' }}>
        <div className="flex gap-4 items-end">
          <PeriodFilter year={year} onYearChange={handleYearChange} period={period} onPeriodChange={setPeriod} />
          <div className="form-group w-full mb-0">
            <label className="form-label" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Marché</label>
            <select className="form-control" value={marcheFilter} onChange={handleMarcheChange}>
              <option value="all">Tous les marchés</option>
              {marches.map((m) => <option key={m.id} value={m.id}>{m.numeroMarche}</option>)}
            </select>
          </div>
          <div className="form-group w-full mb-0">
            <label className="form-label" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Société Prestataire</label>
            <select className="form-control" value={societeFilter} onChange={handleSocieteChange}>
              <option value="all">Toutes les sociétés</option>
              {societeNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && <p className="text-muted">Chargement...</p>}

      {!loading && noDataAtAll && (
        <div className="empty-state">
          <p>
            {emptyReason === 'no-period'
              ? "Aucun marché n'existe pour la période sélectionnée."
              : emptyReason === 'no-filter'
                ? 'Aucun marché ne correspond aux filtres Marché/Société sélectionnés.'
                : 'Aucun rapport disponible pour la période sélectionnée.'}
          </p>
        </div>
      )}

      {!loading && !noDataAtAll && (
        <>
          <div className="kpi-grid mb-6">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#2563eb', background: '#dbeafe' }}>
                <FileTextIcon size={20} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#2563eb' }}>{globalMrt !== null ? formatDuration(globalMrt) : '-'}</div>
                <div className="kpi-label">MRT Global</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#059669', background: '#d1fae5' }}>
                <FileTextIcon size={20} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#059669' }}>{globalPrr !== null ? `${globalPrr}%` : '-'}</div>
                <div className="kpi-label">PRR Global</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#dc2626', background: '#fee2e2' }}>
                <FileTextIcon size={20} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#dc2626' }}>{globalPannes}</div>
                <div className="kpi-label">Pannes Signalées</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#7c3aed', background: '#ede9fe' }}>
                <FileTextIcon size={20} />
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#7c3aed' }}>{globalDispo !== null ? `${globalDispo}%` : '-'}</div>
                <div className="kpi-label">Disponibilité Globale</div>
              </div>
            </div>
          </div>

          <div className="table-container">
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>{reportTitle}</h3>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Marché</th>
                  <th>PRR</th>
                  <th>MRT</th>
                  <th>Disponibilité</th>
                </tr>
              </thead>
              <tbody>
                {(!rows || rows.length === 0) && (
                  <tr><td colSpan={4} className="text-center text-muted" style={{ padding: '2rem' }}>Aucun marché trouvé pour ces filtres.</td></tr>
                )}
                {rows && rows.map((r) => (
                  <tr key={r.marche.id}>
                    <td style={{ fontWeight: 500 }}>{r.marche.numeroMarche}</td>
                    <td>
                      {r.kpi.prr.valeur !== null
                        ? <span className={`badge ${r.kpi.prr.valeur >= 90 ? 'badge-success' : 'badge-danger'}`}>{r.kpi.prr.valeur}%</span>
                        : '-'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}>
                      {r.kpi.mrt.valeur !== null ? formatDuration(r.kpi.mrt.valeur) : '-'}
                    </td>
                    <td>
                      {r.kpi.disponibilite.valeur !== null
                        ? <span className={`badge ${r.kpi.disponibilite.valeur >= 95 ? 'badge-success' : 'badge-warning'}`}>{r.kpi.disponibilite.valeur}%</span>
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default RapportsPage;