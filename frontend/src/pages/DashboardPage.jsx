import { useState, useEffect, useCallback } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { societesApi } from '../services/societes.api.js';
import { marchesApi } from '../services/marches.api.js';
import { dashboardApi } from '../services/dashboard.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PeriodFilter from '../components/PeriodFilter.jsx';
import { yearOverlapsMarche } from '../utils/yearFilters.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
}

function formatDateFR(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function DashboardPage() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const [societes, setSocietes] = useState([]);
  const [marches, setMarches] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState(() => {
    const month = new Date().getMonth() + 1;
    return `T${Math.ceil(month / 3)}`;
  });
  const [societeId, setSocieteId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    societesApi.getAll().then((res) => setSocietes(res.items || res));
  }, []);

  useEffect(() => {
    marchesApi.getAll().then((res) => setMarches(res.items || res));
  }, []);

  const marchesValidesPourAnnee = marches.filter((m) => yearOverlapsMarche(m, year));
  const societesFiltrees = societes.filter((s) =>
    marchesValidesPourAnnee.some((m) => m.id === s.marcheId)
  );

  // La société sélectionnée doit toujours être une vraie société liée à un
  // marché actif sur l'année choisie -- jamais "toutes les sociétés". Dès
  // que la liste filtrée change (changement d'année, ou chargement initial),
  // on sélectionne automatiquement la première société valide si l'actuelle
  // n'existe plus dans la liste.
  useEffect(() => {
    if (societesFiltrees.length > 0 && !societesFiltrees.some((s) => s.id === societeId)) {
      setSocieteId(societesFiltrees[0].id);
    } else if (societesFiltrees.length === 0) {
      setSocieteId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, marches, societes]);

  const [dashboardError, setDashboardError] = useState('');

 const loadDashboard = useCallback(() => {
    if (!societeId) return; // rien à charger tant qu'aucune société valide n'est sélectionnée
    setLoading(true);
    setDashboardError('');
    dashboardApi.getSummary({ period, societeId, year })
      .then(setData)
      .catch((err) => {
        setDashboardError(err.response?.data?.error?.message || 'Impossible de charger le tableau de bord.');
      })
      .finally(() => setLoading(false));
  }, [period, societeId, year]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const aucunMarcheCetteAnnee = marches.length > 0 && marchesValidesPourAnnee.length === 0;

  const sloChartData = data ? {
    labels: ['Conforme SLO', 'Non-conforme'],
    datasets: [{
      data: data.slo.totalSlo > 0 ? [data.slo.compliantCount, data.slo.nonCompliantCount] : [1, 0],
      backgroundColor: ['#059669', '#f1f5f9'],
      hoverBackgroundColor: ['#047857', '#e2e8f0'],
      borderColor: '#ffffff',
      borderWidth: 3,
    }],
  } : null;

  const sloChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 } },
      tooltip: {
        backgroundColor: '#0f172a', bodyColor: '#ffffff', bodyFont: { size: 12 },
        padding: 10, cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          
          Tableau de Bord
        </h1>
        <p className="mb-0">
          {greeting}{user?.prenom ? <>, <strong style={{ color: '#0f172a' }}>{user.prenom} {user.nom}</strong></> : ''}. Aperçu des performances de maintenance.
        </p>
      </div>

      {/* Filtres : une seule ligne garantie, même conteneur que Analyse SLO */}
      <div className="card mb-6" style={{ padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'nowrap', overflowX: 'auto' }}>
         <PeriodFilter year={year} onYearChange={setYear} period={period} onPeriodChange={setPeriod} quartersOnly />
          <div className="form-group mb-0" style={{ minWidth: '220px' }}>
            <label className="form-label" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Société</label>
            <select className="form-control" value={societeId} onChange={(e) => setSocieteId(e.target.value)}>
              {societesFiltrees.length === 0 && <option value="">Aucune société pour {year}</option>}
              {societesFiltrees.map((s) => <option key={s.id} value={s.id}>{s.raisonSociale}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!aucunMarcheCetteAnnee && societesFiltrees.length === 0 && (
        <div className="card mb-6" style={{ padding: '1rem 1.25rem', background: '#fffbeb', border: '1px solid #fde68a' }}>
          <p style={{ margin: 0, color: '#92400e', fontSize: '0.875rem' }}>
            ⚠️ Aucune société liée aux marchés de <strong>{year}</strong> — crée-en une depuis la page Sociétés pour voir des données ici.
          </p>
        </div>
      )}
      {dashboardError && (
        <div className="card mb-6" style={{ padding: '1rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca' }}>
          <p style={{ margin: 0, color: '#991b1b', fontSize: '0.875rem' }}>⚠️ {dashboardError}</p>
        </div>
      )}

      <div className="dash-kpi-grid mb-6">
        {loading && Array(6).fill(0).map((_, i) => (
          <div className="kpi-card" key={i}>
            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
            <div className="kpi-content" style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '60%', height: '22px', marginBottom: '0.375rem' }} />
              <div className="skeleton" style={{ width: '40%', height: '12px' }} />
            </div>
          </div>
        ))}

        {!loading && data && (
          <>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#059669', background: '#d1fae5' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#059669' }}>{data.kpi.prr !== null ? `${data.kpi.prr}%` : '—'}</div>
                <div className="kpi-label">Respect Planning (PRR)</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#2563eb', background: '#dbeafe' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#2563eb' }}>{data.kpi.mrt !== null ? formatDuration(data.kpi.mrt) : '—'}</div>
                <div className="kpi-label">Temps de Réaction (MRT)</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#7c3aed', background: '#ede9fe' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#7c3aed' }}>{data.kpi.disponibilite !== null ? `${data.kpi.disponibilite}%` : '—'}</div>
                <div className="kpi-label">Disponibilité Globale</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#dc2626', background: '#fee2e2' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#dc2626' }}>{data.kpi.pannesCount}</div>
                <div className="kpi-label">Pannes Enregistrées</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#0891b2', background: '#cffafe' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#0891b2' }}>{data.kpi.preventifDone}<span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8' }}>/{data.kpi.preventifTotal}</span></div>
                <div className="kpi-label">Interventions Préventives</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ color: '#d97706', background: '#fef3c7' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#d97706' }}>{data.kpi.reclamationsActives}</div>
                <div className="kpi-label">Réclamations Actives</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1rem', marginBottom: '1rem', alignItems: 'stretch' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '340px', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              Alertes Interventions (Retards Planning)
            </h3>
            {data && data.alertes.length > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ffffff', background: '#dc2626', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>
                {data.alertes.length}
              </span>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '2px' }}>
            {data && data.alertes.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: '#64748b', padding: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: '#059669' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>Aucun retard détecté</div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Toutes les interventions planifiées sont à jour.</p>
              </div>
            )}
            {data && data.alertes.map((a) => {
              const urgent = a.joursRetard >= 5;
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titre}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                      Par <strong>{a.societeNom}</strong> · Prévu le {formatDateFR(a.datePlanifiee)}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: urgent ? '#dc2626' : '#d97706', background: urgent ? '#fee2e2' : '#fef3c7', border: `1px solid ${urgent ? '#fecaca' : '#fcd34d'}`, padding: '0.1875rem 0.5rem', borderRadius: '6px', flexShrink: 0 }}>
                    ⚠️ Retard {a.joursRetard} j.
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '340px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              Conformité SLO
            </h3>
            {data && <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 500 }}>{data.slo.compliantCount} / {data.slo.totalSlo || 1} interventions</span>}
          </div>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px' }}>
            {sloChartData && <Doughnut data={sloChartData} options={sloChartOptions} />}
            {data && (
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', transform: 'translateY(-12px)' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{data.slo.sloPercent}%</span>
                <span style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.125rem' }}>Conforme</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            Dernières Pannes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '200px', overflowY: 'auto' }}>
            {data && data.recentPannes.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.8125rem', fontStyle: 'italic', padding: '0.5rem 0' }}>Aucune panne enregistrée.</div>}
            {data && data.recentPannes.map((p) => {
              const isOpen = p.statut !== 'RESOLUE';
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', background: isOpen ? '#fef2f2' : '#f8fafc', borderRadius: '6px', border: `1px solid ${isOpen ? '#fecaca' : '#f1f5f9'}` }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOpen ? '#dc2626' : '#059669', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.equipementDesignation}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{formatDateFR(p.tPanne)} · {p.statut}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Dernières Réclamations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '200px', overflowY: 'auto' }}>
            {data && data.recentReclamations.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.8125rem', fontStyle: 'italic', padding: '0.5rem 0' }}>Aucune réclamation enregistrée.</div>}
            {data && data.recentReclamations.map((r) => {
              const colors = {
                NOUVELLE: { color: '#dc2626', bg: '#fee2e2', label: 'Ouverte' },
                EN_COURS: { color: '#d97706', bg: '#fef3c7', label: 'En cours' },
                RESOLUE: { color: '#059669', bg: '#d1fae5', label: 'Résolue' },
              }[r.statut] || { color: '#64748b', bg: '#f1f5f9', label: r.statut };
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.objet || 'Réclamation'}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{formatDateFR(r.tNotification)}</div>
                  </div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: colors.color, background: colors.bg, padding: '0.125rem 0.5rem', borderRadius: '9999px', flexShrink: 0 }}>{colors.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;