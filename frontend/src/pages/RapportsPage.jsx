import { useState, useEffect } from 'react';
import { marchesApi } from '../services/marches.api.js';
import { societesApi } from '../services/societes.api.js';
import { pannesApi } from '../services/pannes.api.js';
import { equipementsApi } from '../services/equipements.api.js';
import { kpiApi } from '../services/kpi.api.js';
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

function RapportsPage() {
  const [marches, setMarches] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [pannes, setPannes] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState('all');
  const [marcheFilter, setMarcheFilter] = useState('all');
  const [societeFilter, setSocieteFilter] = useState('all'); // stocke desormais le NOM de la societe, pas un id
  const [rows, setRows] = useState(null);
  const [emptyReason, setEmptyReason] = useState(null); // 'no-filter' | 'no-period' | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marchesApi.getAll().then((res) => setMarches(res.data || res));
    societesApi.getAll().then((res) => setSocietes(res.data || res));
    pannesApi.getAll().then((res) => setPannes(res.data || res));
    equipementsApi.getAll().then((res) => setEquipements(res.data || res));
  }, []);

  // Liste des noms d'entreprises uniques (une meme entreprise peut avoir
  // plusieurs lignes "Societe" en base, une par marche auquel elle est liee).
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
    // Chevauchement : le marche existe pour cette periode si ses dates
    // de contrat croisent au moins partiellement la periode filtree.
    return marcheStart <= periodEnd && marcheEnd >= periodStart;
  }

  function targetMarches() {
    if (societeFilter !== 'all') {
      // Toutes les lignes "Societe" portant ce nom, quel que soit leur marcheId,
      // pour couvrir le cas d'une entreprise presente sur plusieurs marches.
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
    // Auto-selection uniquement si ce marche n'a qu'une seule entreprise liee
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
    // Si l'entreprise n'est liee qu'a UN seul marche, on peut le pre-selectionner.
    // Si elle est liee a PLUSIEURS marches, on laisse "Tous les marches" affiche,
    // car le filtre societe couvre deja tous ses marches simultanement.
    setMarcheFilter(marcheIdsDeCetteSociete.length === 1 ? marcheIdsDeCetteSociete[0] : 'all');
  }

  function handleYearChange(newYear) {
    setYear(newYear);
  }

  function handleYearBlur(e) {
    // Garde-fou : corrige une saisie manifestement erronee (ex: "2201" tape par erreur)
    // sans pour autant limiter la saisie a une liste fermee.
    const num = Number(e.target.value);
    if (Number.isNaN(num) || num < 2000 || num > 2100) {
      setYear(new Date().getFullYear());
    }
  }

  async function generateDashboard() {
    if (marches.length === 0) return;
    setLoading(true);
    const { dateDebut, dateFin } = periodToDateRange(year, period);

    // Etape 1 : marches correspondant aux filtres Marche/Societe (inchange)
    const scopeParFiltres = targetMarches();
    if (scopeParFiltres.length === 0) {
      setRows([]);
      setEmptyReason('no-filter');
      setLoading(false);
      return;
    }

    // Etape 2 : parmi ceux-ci, seulement ceux dont le contrat couvre la periode choisie
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

  function exportPdf() {
    if (!rows || rows.length === 0) return alert('Aucune donnée à exporter.');
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text('ONDA', 14, 20);
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('RAPPORT ANALYTIQUE GLOBAL', 200, 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Période : ${periodLabel(year, period)}`, 200, 26, { align: 'right' });
    doc.line(14, 30, 200, 30);

    const tableData = rows.map((r) => [
      periodLabel(year, period),
      r.marche.numeroMarche,
      r.kpi.prr.valeur !== null ? `${r.kpi.prr.valeur} %` : '-',
      r.kpi.mrt.valeur !== null ? formatDuration(r.kpi.mrt.valeur) : '-',
      r.kpi.disponibilite.valeur !== null ? `${r.kpi.disponibilite.valeur} %` : '-',
    ]);

    autoTable(doc, {
      startY: 40,
      headStyles: { fillColor: [79, 70, 229] },
      head: [['Période', 'Marché', 'PRR', 'MRT', 'Disponibilité']],
      body: tableData,
      theme: 'grid',
    });

    doc.save(`Rapport_Global_${year}_${period}.pdf`);
  }

  function exportExcel() {
    if (!rows || rows.length === 0) return alert('Aucune donnée à exporter.');
    const data = rows.map((r) => ({
      Période: periodLabel(year, period),
      Marché: r.marche.numeroMarche,
      'PRR (%)': r.kpi.prr.valeur,
      MRT: r.kpi.mrt.valeur !== null ? formatDuration(r.kpi.mrt.valeur) : '-',
      'Disponibilité (%)': r.kpi.disponibilite.valeur,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport Global');
    XLSX.writeFile(workbook, `Extract_Rapport_${year}_${period}.xlsx`);
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
          <button className="btn btn-secondary" onClick={exportPdf}>
            <FileTextIcon size={15} />
            Export PDF
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
              <h3 style={{ fontSize: '0.875rem', margin: 0, color: '#374151' }}>
                Performances par Marché — {periodLabel(year, period)}
                {societeFilter !== 'all' && <span style={{ fontWeight: 400, color: '#64748b' }}> — {societeFilter}</span>}
              </h3>
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