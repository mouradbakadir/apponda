import { useState, useEffect } from 'react';
import { useCrud } from '../hooks/useCrud.js';
import { preventifVisitesApi } from '../services/preventifVisites.api.js';
import { societesApi } from '../services/societes.api.js';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { PlusIcon, EditIcon, TrashIcon } from '../components/icons.jsx';
import PeriodFilter, { isDateInYearPeriod } from '../components/PeriodFilter.jsx';

const pageStyles = `
  @keyframes pulse-ring {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
    70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
  }
  .preventif-tooltip-container { position: relative; display: inline-flex; align-items: center; }
  .preventif-tooltip-text {
    visibility: hidden; width: 220px; background-color: #0f172a; color: #ffffff;
    text-align: center; border-radius: 8px; padding: 0.625rem 0.875rem;
    position: absolute; z-index: 100; bottom: 135%; left: 50%;
    transform: translateX(-50%); opacity: 0; transition: opacity 150ms ease, transform 150ms ease;
    font-size: 0.75rem; font-weight: 500; line-height: 1.4; pointer-events: none;
  }
  .preventif-tooltip-container:hover .preventif-tooltip-text {
    visibility: visible; opacity: 1; transform: translateX(-50%) translateY(-2px);
  }
  .preventif-tooltip-text::after {
    content: ""; position: absolute; top: 100%; left: 50%; margin-left: -6px;
    border-width: 6px; border-style: solid; border-color: #0f172a transparent transparent transparent;
  }
`;

function BellIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  );
}

function AlertTriangleIcon({ size = 14, color = '#dc2626' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
}

const emptyForm = {
  societeId: '', titre: '',
  datePlanifiee: '', datePlanifieeFin: '',
  dateRealisee: '', dateRealiseeFin: '',
  statut: 'PLANIFIEE', observations: '',
};

function formatDateFR(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d) ? '-' : d.toLocaleDateString('fr-FR');
}

// Une intervention peut s'etaler sur plusieurs jours : la date de fin est
// facultative, on n'affiche l'intervalle que lorsqu'elle est renseignee.
function formatDateRangeFR(debut, fin) {
  if (!debut) return '-';
  if (!fin || fin.slice(0, 10) === debut.slice(0, 10)) return formatDateFR(debut);
  return `${formatDateFR(debut)} → ${formatDateFR(fin)}`;
}

// Date de fin effective d'un intervalle (la date de debut s'il n'y a pas d'intervalle).
function finPlanifiee(v) {
  return v.datePlanifieeFin || v.datePlanifiee;
}

function finRealisee(v) {
  return v.dateRealiseeFin || v.dateRealisee;
}

function statutBadgeClass(statut) {
  if (statut === 'REALISEE') return 'badge-success';
  if (statut === 'PLANIFIEE') return 'badge-info';
  if (statut === 'ANNULEE') return 'badge-danger';
  return 'badge-neutral';
}

function PreventifPage() {
  const { items, loading, error, create, update, remove } = useCrud(preventifVisitesApi);
  const [societes, setSocietes] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    societesApi.getAll().then((res) => setSocietes(res.data || res));
  }, []);

  function societeName(societeId) {
    const s = societes.find((ss) => ss.id === societeId);
    return s ? s.raisonSociale : 'Société inconnue';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function daysBetweenTodayAnd(iso) {
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  }

  // Jours restants avant le DEBUT de l'intervention.
  function daysLeftFor(v) {
    return daysBetweenTodayAnd(v.datePlanifiee);
  }

  // Jours restants avant la FIN : tant qu'elle n'est pas depassee, l'intervention
  // n'est pas en retard (cas des interventions etalees sur plusieurs jours).
  function daysLeftUntilEndFor(v) {
    return daysBetweenTodayAnd(finPlanifiee(v));
  }

  const upcomingAlerts = items
    .filter((v) => v.statut === 'PLANIFIEE')
    .map((v) => ({ ...v, daysLeft: daysLeftFor(v), daysLeftEnd: daysLeftUntilEndFor(v) }))
    .filter((v) => v.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const filteredItems = items.filter(
    (v) => isDateInYearPeriod(v.datePlanifiee, year, period)
      || isDateInYearPeriod(v.datePlanifieeFin, year, period)
  );

  function renderTitre(v) {
    if (v.statut !== 'PLANIFIEE') {
      return <span style={{ fontWeight: 500, color: '#0f172a' }}>{v.titre}</span>;
    }
    const diffDays = daysLeftFor(v);
    if (diffDays > 3) {
      return <span style={{ fontWeight: 500, color: '#0f172a' }}>{v.titre}</span>;
    }
    const diffEnd = daysLeftUntilEndFor(v);
    const tooltipText = diffEnd < 0
      ? `Rappel : Intervention en retard de ${Math.abs(diffEnd)} jour${Math.abs(diffEnd) > 1 ? 's' : ''}`
      : diffDays < 0
        ? `Rappel : Intervention en cours, jusqu'au ${formatDateFR(finPlanifiee(v))}`
        : diffDays === 0
          ? `Rappel : Intervention prévue aujourd'hui`
          : `Rappel : Intervention prévue dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

    return (
      <div className="preventif-tooltip-container" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <span style={{ fontWeight: 600, color: '#b45309' }}>{v.titre}</span>
        <span style={{ color: '#dc2626', display: 'inline-flex', cursor: 'help' }}>
          <AlertTriangleIcon />
        </span>
        <div className="preventif-tooltip-text">{tooltipText}</div>
      </div>
    );
  }

  function prrBadge(v) {
    if (v.statut !== 'REALISEE') return <span className="badge badge-neutral">-</span>;
    const isOnTime = v.dateRealisee && finRealisee(v).slice(0, 10) <= finPlanifiee(v).slice(0, 10);
    return isOnTime
      ? <span className="badge badge-success">100%</span>
      : <span className="badge badge-danger">0%</span>;
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, datePlanifiee: new Date().toISOString().slice(0, 10) });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      societeId: row.societeId,
      titre: row.titre,
      datePlanifiee: row.datePlanifiee.slice(0, 10),
      datePlanifieeFin: row.datePlanifieeFin ? row.datePlanifieeFin.slice(0, 10) : '',
      dateRealisee: row.dateRealisee ? row.dateRealisee.slice(0, 10) : '',
      dateRealiseeFin: row.dateRealiseeFin ? row.dateRealiseeFin.slice(0, 10) : '',
      statut: row.statut,
      observations: row.observations || '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const payload = { ...form };
    if (payload.dateRealisee && payload.statut === 'PLANIFIEE') payload.statut = 'REALISEE';
    if (!payload.dateRealisee) {
      delete payload.dateRealisee;
      payload.dateRealiseeFin = '';
    }
    // Une date de fin vide est envoyee a null pour effacer un intervalle existant.
    payload.datePlanifieeFin = payload.datePlanifieeFin || null;
    payload.dateRealiseeFin = payload.dateRealiseeFin || null;
    if (!payload.observations) delete payload.observations;
    try {
      if (editingId) await update(editingId, payload);
      else await create(payload);
      setModalOpen(false);
    } catch (err) {
      const details = err.response?.data?.error?.details;
      setFormError(
        details ? details.map((d) => `${d.champ}: ${d.message}`).join(' | ')
                : err.response?.data?.error?.message || 'Erreur'
      );
    }
  }

  async function confirmDeleteOne() {
    const row = confirmTarget.row;
    setConfirmTarget(null);
    try {
      await remove(row.id);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Erreur de suppression');
    }
  }
  async function confirmDeleteAll() {
    setConfirmTarget(null);
    try {
      for (const row of filteredItems) {
        await remove(row.id);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Erreur lors de la suppression globale');
    }
  }

  return (
    <div>
      <style>{pageStyles}</style>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Maintenance Préventive</h1>
          <p className="mb-0">Suivi et planification de toutes les interventions prestataires</p>
        </div>
        <div className="flex gap-2">
          {filteredItems.length > 0 && (
            <button className="btn btn-danger" onClick={() => setConfirmTarget({ type: 'all' })}>
              <TrashIcon size={16} />
              Supprimer tout
            </button>
          )}
          <button className="btn btn-primary" onClick={openCreate}>
            <PlusIcon size={16} />
            Ajouter
          </button>
        </div>
      </div>

      {upcomingAlerts.length > 0 && (
        <div className="card mb-6" style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-xl, 12px)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%', background: '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626',
              position: 'relative', flexShrink: 0, animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}>
              <BellIcon />
              <span style={{
                position: 'absolute', top: '-3px', right: '-3px', width: '20px', height: '20px',
                borderRadius: '50%', background: '#dc2626', color: 'white', fontSize: '0.6875rem',
                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fef2f2',
              }}>
                {upcomingAlerts.length}
              </span>
            </div>
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <h3 style={{ color: '#991b1b', fontSize: '0.9375rem', marginTop: '0.125rem', marginBottom: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>Rappels de maintenance préventive</span>
                <span style={{ background: '#dc2626', color: 'white', fontSize: '0.725rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center' }}>
                  {upcomingAlerts.length} {upcomingAlerts.length === 1 ? 'intervention à venir' : 'interventions à venir'}
                </span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {upcomingAlerts.map((a) => {
                  const timeDetail = a.daysLeftEnd < 0
                    ? ` - en retard de ${Math.abs(a.daysLeftEnd)} jours`
                    : a.daysLeft < 0
                      ? ` - en cours`
                      : a.daysLeft === 0
                        ? ` - aujourd'hui`
                        : ` - dans ${a.daysLeft} jour${a.daysLeft > 1 ? 's' : ''}`;
                  return (
                    <div key={a.id} style={{
                      background: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(252, 165, 165, 0.3)',
                      borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.8125rem', color: '#451a03',
                      display: 'flex', gap: '0.5rem', alignItems: 'flex-start', lineHeight: 1.4,
                    }}>
                      <span style={{ color: '#dc2626', flexShrink: 0, marginTop: '0.125rem' }}>
                        <AlertTriangleIcon size={16} />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        Rappel : L'intervention préventive par la société <strong style={{ color: '#1e293b' }}>{societeName(a.societeId)}</strong> est planifiée {a.datePlanifieeFin ? 'du' : 'le'} <strong style={{ color: '#1e293b' }}>{formatDateRangeFR(a.datePlanifiee, a.datePlanifieeFin).replace(' → ', ' au ')}</strong> (dans moins de 3 jours{timeDetail}).
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-6" style={{ padding: '0.75rem 1.25rem' }}>
        <div className="flex gap-4 items-center">
          <PeriodFilter year={year} onYearChange={setYear} period={period} onPeriodChange={setPeriod} />
        </div>
      </div>

      {loading && <p className="text-muted">Chargement...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="empty-state">
          <p>Aucune intervention préventive trouvée pour la période sélectionnée.</p>
        </div>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <div className="table-container">
          <div className="overflow-x-auto w-full">
            <table className="table" style={{ minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th>Titre de l'intervention</th>
                  <th>Société Prestataire</th>
                  <th>Date Planifiée</th>
                  <th>Date Réalisée</th>
                  <th>PRR</th>
                  <th>Statut</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((v) => {
                  const diffDays = daysLeftFor(v);
                  const isAlertRow = v.statut === 'PLANIFIEE' && diffDays <= 3;
                  return (
                    <tr key={v.id} style={isAlertRow ? { backgroundColor: '#fdfaf2' } : {}}>
                      <td>{renderTitre(v)}</td>
                      <td>{societeName(v.societeId)}</td>
                      <td>{formatDateRangeFR(v.datePlanifiee, v.datePlanifieeFin)}</td>
                      <td>{formatDateRangeFR(v.dateRealisee, v.dateRealiseeFin)}</td>
                      <td>{prrBadge(v)}</td>
                      <td><span className={`badge ${statutBadgeClass(v.statut)}`}>{v.statut}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                          <button className="btn-action-icon btn-edit" title="Éditer" onClick={() => openEdit(v)}>
                            <EditIcon size={16} />
                          </button>
                          <button className="btn-action-icon btn-delete" title="Supprimer" onClick={() => setConfirmTarget({ type: 'one', row: v })}>
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Détails de l'Intervention" : 'Nouvelle Intervention'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group w-full">
            <label className="form-label">Société Prestataire</label>
            <select className="form-control" required
              value={form.societeId} onChange={(e) => setForm({ ...form, societeId: e.target.value })}>
              <option value="">-- Sélectionnez une société --</option>
              {societes.map((s) => <option key={s.id} value={s.id}>{s.raisonSociale}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Titre / Objet de la visite</label>
            <input type="text" className="form-control" placeholder="Ex: Visite Trimestrielle TGBT" required
              value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
          </div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Date planifiée (début)</label>
              <input type="date" className="form-control" required
                value={form.datePlanifiee} onChange={(e) => setForm({ ...form, datePlanifiee: e.target.value })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">
                Date planifiée (fin) <span style={{ color: '#94a3b8', fontWeight: 400 }}>— facultatif</span>
              </label>
              <input type="date" className="form-control" min={form.datePlanifiee || undefined}
                value={form.datePlanifieeFin} onChange={(e) => setForm({ ...form, datePlanifieeFin: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Date réalisée (début)</label>
              <input type="date" className="form-control"
                value={form.dateRealisee} onChange={(e) => setForm({ ...form, dateRealisee: e.target.value, dateRealiseeFin: e.target.value ? form.dateRealiseeFin : '' })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">
                Date réalisée (fin) <span style={{ color: '#94a3b8', fontWeight: 400 }}>— facultatif</span>
              </label>
              <input type="date" className="form-control" min={form.dateRealisee || undefined}
                disabled={!form.dateRealisee}
                value={form.dateRealiseeFin} onChange={(e) => setForm({ ...form, dateRealiseeFin: e.target.value })} />
            </div>
          </div>

          <p style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            Laissez la date de fin vide si l'intervention se déroule sur une seule journée.
          </p>

          <div className="form-group">
            <label className="form-label">Statut</label>
            <select className="form-control" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
              <option value="PLANIFIEE">Planifiée (À faire)</option>
              <option value="REALISEE">Réalisée (Terminée)</option>
              <option value="ANNULEE">Annulée</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Observations</label>
            <textarea className="form-control" rows={3}
              value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
          </div>

          {formError && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '1rem' }}>{formError}</p>}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!confirmTarget}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmTarget?.type === 'all' ? confirmDeleteAll : confirmDeleteOne}
        title={confirmTarget?.type === 'all' ? 'Confirmer la suppression globale' : 'Confirmer la suppression'}
        message={
          confirmTarget?.type === 'all'
            ? 'Êtes-vous sûr de vouloir supprimer toutes les interventions ? Cette action est irréversible.'
            : 'Êtes-vous sûr de vouloir supprimer cette intervention ?'
        }
        confirmLabel={confirmTarget?.type === 'all' ? 'Supprimer tout' : 'Supprimer'}
      />
    </div>
  );
}

export default PreventifPage;