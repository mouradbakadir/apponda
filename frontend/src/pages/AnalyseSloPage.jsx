import { useState, useEffect, useCallback } from 'react';
import { marchesApi } from '../services/marches.api.js';
import { societesApi } from '../services/societes.api.js';
import { sloApi } from '../services/slo.api.js';
import PeriodFilter from '../components/PeriodFilter.jsx';
import { yearOverlapsMarche } from '../utils/yearFilters.js';

function AnalyseSloPage() {
  const [marches, setMarches] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
 const [period, setPeriod] = useState(() => {
    const month = new Date().getMonth() + 1;
    return `T${Math.ceil(month / 3)}`;
  });
  const [marcheId, setMarcheId] = useState('');
  const [societeId, setSocieteId] = useState('');

  const [configForm, setConfigForm] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    marchesApi.getAll().then((data) => setMarches(data.items || data));
  }, []);

  useEffect(() => {
    societesApi.getAll().then((data) => setSocietes(data.items || data));
  }, []);

  const marchesValidesPourAnnee = marches.filter((m) => yearOverlapsMarche(m, year));

  useEffect(() => {
    if (marchesValidesPourAnnee.length > 0 && !marchesValidesPourAnnee.some((m) => m.id === marcheId)) {
      setMarcheId(marchesValidesPourAnnee[0].id);
    } else if (marchesValidesPourAnnee.length === 0) {
      setMarcheId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, marches]);

  const societesFiltrees = societes.filter((s) => s.marcheId === marcheId);

  useEffect(() => {
    if (societesFiltrees.length > 0 && !societesFiltrees.some((s) => s.id === societeId)) {
      setSocieteId(societesFiltrees[0].id);
    } else if (societesFiltrees.length === 0) {
      setSocieteId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marcheId, societes]);

  useEffect(() => {
    if (!societeId) { setConfigForm(null); return; }
    sloApi.getConfig(societeId).then((config) => {
      setConfigForm({
        seuilPrr: Number(config.seuilPrr),
        coefPrr: Number(config.coefPrr),
        seuilMrtHeures: Number(config.seuilMrtHeures),
        coefMrt: Number(config.coefMrt),
        seuilDispo: Number(config.seuilDispo),
        coefDispo: Number(config.coefDispo),
      });
    });
  }, [societeId]);

  const loadAnalysis = useCallback(() => {
    if (!marcheId || !societeId || !configForm) { setAnalysis(null); return; }
    setError('');
    sloApi.getAnalysis({ marcheId, societeId, period, year })
      .then(setAnalysis)
      .catch((err) => setError(err.response?.data?.error?.message || 'Erreur lors du calcul'));
  }, [marcheId, societeId, period, year, configForm]);

  useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

  async function handleSaveConfig(e) {
    e.preventDefault();
    setError('');
    try {
      await sloApi.saveConfig({ societeId, ...configForm });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadAnalysis();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la sauvegarde');
    }
  }

  function updateConfig(field, value) {
    setConfigForm((prev) => ({ ...prev, [field]: value === '' ? '' : Number(value) }));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Analyse SLO</h1>
          <p className="mb-0">Calcul des niveaux de service par période et par marché</p>
        </div>
      </div>

      <div className="card mb-6" style={{ padding: '0.875rem 1.25rem' }}>
        <div className="flex gap-4 items-end" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
          <PeriodFilter year={year} onYearChange={setYear} period={period} onPeriodChange={setPeriod} quartersOnly />
          <div className="form-group w-full mb-0" style={{ minWidth: '200px' }}>
            <label className="form-label" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Marché</label>
            <select className="form-control" value={marcheId} onChange={(e) => setMarcheId(e.target.value)}>
              {marchesValidesPourAnnee.length === 0 && <option value="">Aucun marché en {year}</option>}
              {marchesValidesPourAnnee.map((m) => <option key={m.id} value={m.id}>{m.numeroMarche}</option>)}
            </select>
          </div>
          <div className="form-group w-full mb-0" style={{ minWidth: '200px' }}>
            <label className="form-label" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Société Prestataire</label>
            <select className="form-control" value={societeId} onChange={(e) => setSocieteId(e.target.value)}>
              {societesFiltrees.length === 0 && <option value="">Aucune société</option>}
              {societesFiltrees.map((s) => <option key={s.id} value={s.id}>{s.raisonSociale}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

      {marchesValidesPourAnnee.length === 0 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#64748b', margin: 0 }}>
            Aucun marché actif en <strong>{year}</strong> pour cet aéroport — sélectionnez une autre année, ou créez d'abord un marché sur cette période.
          </p>
        </div>
      )}

      {marchesValidesPourAnnee.length > 0 && (
        <div className="grid grid-cols-1 md-grid-cols-2 gap-6">
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="mb-4 text-slate-800 font-medium">Configuration des Seuils & Coefficients</h3>
            {configForm && (
              <form onSubmit={handleSaveConfig}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="form-group mb-0">
                    <label className="form-label">Seuil PRR (%)</label>
                    <input type="number" step="any" required className="form-control"
                      value={configForm.seuilPrr} onChange={(e) => updateConfig('seuilPrr', e.target.value)} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Coefficient PRR</label>
                    <input type="number" step="any" required className="form-control"
                      value={configForm.coefPrr} onChange={(e) => updateConfig('coefPrr', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="form-group mb-0">
                    <label className="form-label">Seuil MRT (Heures)</label>
                    <input type="number" step="any" required className="form-control"
                      value={configForm.seuilMrtHeures} onChange={(e) => updateConfig('seuilMrtHeures', e.target.value)} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Coefficient MRT</label>
                    <input type="number" step="any" required className="form-control"
                      value={configForm.coefMrt} onChange={(e) => updateConfig('coefMrt', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="form-group mb-0">
                    <label className="form-label">Seuil Disponibilité (%)</label>
                    <input type="number" step="any" required className="form-control"
                      value={configForm.seuilDispo} onChange={(e) => updateConfig('seuilDispo', e.target.value)} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Coefficient Disponibilité</label>
                    <input type="number" step="any" required className="form-control"
                      value={configForm.coefDispo} onChange={(e) => updateConfig('coefDispo', e.target.value)} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full">Enregistrer la Configuration</button>
                {saveSuccess && <div className="badge badge-success mt-3 w-full justify-center">Configuration sauvegardée</div>}
              </form>
            )}
            {!configForm && <p className="text-muted">Sélectionnez une société pour configurer les seuils.</p>}
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 className="mb-4 text-slate-800 font-medium">Résultats du Calcul SLO</h3>
            <div style={{ flex: 1 }}>
              {!societeId && <div className="empty-state">Veuillez sélectionner une société.</div>}

              {analysis && (
                <>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1rem' }}>
                    <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <div>
                        <span className="text-slate-500 font-medium block" style={{ fontSize: '0.85rem' }}>SLO Global Obtenu</span>
                        <span className="text-slate-400 font-mono text-xs">SLO = Σ (Conformités × Coef)</span>
                      </div>
                      <div className="text-right">
                        <span style={{ fontSize: '2.25rem', fontWeight: 700, color: analysis.global.pourcentage >= 100 ? '#059669' : analysis.global.pourcentage >= 90 ? '#d97706' : '#dc2626' }}>
                          {analysis.global.pourcentage.toFixed(2)}%
                        </span>
                        <span className="text-slate-400 font-mono block text-xs" style={{ marginTop: '-4px' }}>Indice: {analysis.global.indice.toFixed(3)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.75rem' }}>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-slate-700"><strong>PRR</strong> (Seuil: {analysis.prr.seuil}%)</span>
                          <span className={`badge badge-${analysis.prr.conforme ? 'success' : 'danger'}`}>
                            {analysis.prr.conforme === null ? 'N/A' : analysis.prr.conforme ? 'CONFORME' : 'NON CONFORME'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                          <span>Réel: {analysis.prr.reel !== null ? `${analysis.prr.reel}%` : 'N/A'}</span>
                          <span>Conformité (Indice): <strong className="text-slate-800">{analysis.prr.indice.toFixed(3)}</strong> (Coef: {analysis.config.coefPrr})</span>
                        </div>
                      </div>

                      <div style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.75rem' }}>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-slate-700"><strong>MRT</strong> (Seuil: {analysis.config.seuilMrtHeures}h / {analysis.config.seuilMrtMinutes}min)</span>
                          <span className={`badge badge-${analysis.mrt.conforme ? 'success' : 'danger'}`}>
                            {analysis.mrt.conforme === null ? 'N/A' : analysis.mrt.conforme ? 'CONFORME' : 'NON CONFORME'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                          <span>Réel: {analysis.mrt.reelMinutes !== null ? `${analysis.mrt.reelMinutes} min` : 'N/A'}</span>
                          <span>Conformité (Indice): <strong className="text-slate-800">{analysis.mrt.indice.toFixed(3)}</strong> (Coef: {analysis.config.coefMrt})</span>
                        </div>
                      </div>

                      <div style={{ paddingBottom: '0.25rem' }}>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-slate-700"><strong>Disponibilité</strong> (Seuil: {analysis.config.seuilDispo}%)</span>
                          <span className={`badge badge-${analysis.disponibilite.conforme ? 'success' : 'danger'}`}>
                            {analysis.disponibilite.conforme === null ? 'N/A' : analysis.disponibilite.conforme ? 'CONFORME' : 'NON CONFORME'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                          <span>Réel: {analysis.disponibilite.reel !== null ? `${analysis.disponibilite.reel}%` : 'N/A'}</span>
                          <span>Conformité (Indice): <strong className="text-slate-800">{analysis.disponibilite.indice.toFixed(3)}</strong> (Coef: {analysis.config.coefDispo})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.75rem', marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d', display: 'block', marginBottom: '0.25rem' }}>📝 Règles contractuelles appliquées :</span>
                    <ul className="text-slate-600 text-xs" style={{ margin: 0, paddingLeft: '1rem', listStyleType: 'disc' }}>
                      <li><strong>Indice MRT</strong> : Si le résultat dépasse le seuil ({analysis.config.seuilMrtHeures}h), la formule <code>Seuil / Résultat</code> s'applique. Sinon, l'indice est ramené à <strong>1.000</strong>.</li>
                      <li><strong>Calcul du SLO</strong> : <code>SLO = (Σ Conformité × Coef) / Σ Coef</code>.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyseSloPage;