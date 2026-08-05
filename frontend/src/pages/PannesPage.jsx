import { useState, useEffect } from 'react';
import { useCrud } from '../hooks/useCrud.js';
import { pannesApi } from '../services/pannes.api.js';
import { equipementsApi } from '../services/equipements.api.js';
import { societesApi } from '../services/societes.api.js';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PlusIcon, EditIcon, TrashIcon, CheckIcon, EyeIcon, AlertTriangleIcon } from '../components/icons.jsx';
import PeriodFilter, { isDateInYearPeriod, periodLabel } from '../components/PeriodFilter.jsx';

const causes = ['USURE', 'DEFAUT_ELECTRIQUE', 'DEFAUT_MECANIQUE', 'FACTEUR_EXTERNE', 'INCONNU'];
const impacts = ['CRITIQUE', 'MAJEUR', 'MINEUR'];

const emptyCreateForm = { equipementId: '', tPanne: '', description: '', causePanne: 'INCONNU', impact: 'MINEUR' };

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d) ? '-' : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuree(mins) {
  if (mins === null || mins === undefined) return '-';
  if (mins === 0) return '0 min';
  const rounded = Math.round(mins);
  const d = Math.floor(rounded / (60 * 24));
  const h = Math.floor((rounded % (60 * 24)) / 60);
  const m = rounded % 60;
  if (d > 0) return m > 0 ? `${d}j ${h}h ${m}m` : `${d}j ${h}h`;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function statutBadgeClass(statut) {
  if (statut === 'OUVERTE') return 'badge-danger';
  if (statut === 'RESOLUE') return 'badge-success';
  return 'badge-warning';
}

function impactBadgeClass(impact) {
  if (impact === 'CRITIQUE') return 'badge-danger';
  if (impact === 'MAJEUR') return 'badge-warning';
  return 'badge-neutral'; // MINEUR
}

function PannesPage() {
  const { user } = useAuth();
  const isSuperviseur = user?.role === 'SUPER_ADMIN' || user?.role === 'SUPERVISEUR';

  const { items, loading, error, create, remove, refetch } = useCrud(pannesApi);
  const [equipements, setEquipements] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState('all');
  const [societeFilter, setSocieteFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'close' | 'view'
  const [activePanne, setActivePanne] = useState(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [closeForm, setCloseForm] = useState({ tReprise: '', actionsCorrectives: '' });
  const [formError, setFormError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    equipementsApi.getAll().then((res) => setEquipements(res.data || res));
    societesApi.getAll().then((res) => setSocietes(res.data || res));
  }, []);

  function equipementInfo(equipementId) {
    return equipements.find((e) => e.id === equipementId);
  }

  function societeIdForEquipement(equipementId) {
    return equipementInfo(equipementId)?.societeId;
  }

  const societesDisponibles = societes.filter((s) => equipements.some((e) => e.societeId === s.id));

  const filteredPannes = items.filter((p) => {
    if (societeFilter !== 'all' && societeIdForEquipement(p.equipementId) !== societeFilter) return false;
    return isDateInYearPeriod(p.tPanne, year, period);
  });

  // --- KPI indicatif de disponibilite sur la periode/societe filtree ---
  // Remarque : indicateur d'affichage rapide, calcule cote client sur cette page.
  // Le KPI officiel/contractuel reste celui calcule cote serveur (/api/kpi) sur le Dashboard.
  const equipementsScope = societeFilter === 'all'
    ? equipements
    : equipements.filter((e) => e.societeId === societeFilter);

  const totalArretMinutes = filteredPannes.reduce((sum, p) => sum + (p.dureeArretMinutes || 0), 0);
  const nbJoursApprox = period === 'all' ? 365 : (period.startsWith('T') ? 91 : 30);
  const totalPossibleMinutes = Math.max(1, equipementsScope.length * nbJoursApprox * 24 * 60);
  const disponibilite = Math.max(0, Math.min(100, ((totalPossibleMinutes - totalArretMinutes) / totalPossibleMinutes) * 100));

  let kpiColor = '#059669', kpiBg = '#d1fae5';
  if (disponibilite < 95) { kpiColor = '#dc2626'; kpiBg = '#fee2e2'; }
  else if (disponibilite < 98) { kpiColor = '#d97706'; kpiBg = '#fef3c7'; }

  function openCreate() {
    setModalMode('create');
    setActivePanne(null);
    setCreateForm({ ...emptyCreateForm, tPanne: new Date().toISOString().slice(0, 16) });
    setFormError('');
    setModalOpen(true);
  }

  function openClose(panne) {
    setModalMode('close');
    setActivePanne(panne);
    setCloseForm({ tReprise: new Date().toISOString().slice(0, 16), actionsCorrectives: '' });
    setFormError('');
    setModalOpen(true);
  }

  function openView(panne) {
    setModalMode('view');
    setActivePanne(panne);
    setFormError('');
    setModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setFormError('');
    try {
      await create({ ...createForm, tPanne: new Date(createForm.tPanne).toISOString() });
      setModalOpen(false);
    } catch (err) {
      const details = err.response?.data?.error?.details;
      setFormError(details ? details.map((d) => `${d.champ}: ${d.message}`).join(' | ') : err.response?.data?.error?.message || 'Erreur');
    }
  }

  async function handleCloseSubmit(e) {
    e.preventDefault();
    setFormError('');
    try {
      await pannesApi.close(activePanne.id, {
        tReprise: new Date(closeForm.tReprise).toISOString(),
        actionsCorrectives: closeForm.actionsCorrectives || undefined,
      });
      setModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Erreur');
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
      for (const row of filteredPannes) {
        await remove(row.id);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Erreur lors de la suppression globale');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Gestion des Pannes</h1>
          <p className="mb-0">Enregistrement des temps d'arrêt pour calcul de la Disponibilité</p>
        </div>
        <div className="flex gap-2">
          {filteredPannes.length > 0 && (
            <button className="btn btn-danger" onClick={() => setConfirmTarget({ type: 'all' })}>
              <TrashIcon size={16} />
              Supprimer tout
            </button>
          )}
          <button className="btn btn-danger" onClick={openCreate}>
            <AlertTriangleIcon size={16} />
            Déclarer une Panne
          </button>
        </div>
      </div>

      <div className="card mb-6" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <PeriodFilter year={year} onYearChange={setYear} period={period} onPeriodChange={setPeriod} />
        <div className="form-group mb-0">
          <label className="form-label" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Société</label>
          <select className="form-control" style={{ minWidth: '200px' }} value={societeFilter} onChange={(e) => setSocieteFilter(e.target.value)}>
            <option value="all">Toutes les sociétés</option>
            {societesDisponibles.map((s) => (
              <option key={s.id} value={s.id}>{s.raisonSociale}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card mb-6" style={{ padding: '1.5rem', borderLeft: `4px solid ${kpiColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: kpiBg, padding: '0.875rem', borderRadius: '50%', color: kpiColor }}>
              <CheckIcon size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Disponibilité {periodLabel(year, period)}
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{disponibilite.toFixed(1)}%</div>
            </div>
          </div>
          <div style={{ height: '40px', width: '1px', background: '#e2e8f0' }}></div>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Temps d'Arrêt Total
            </h3>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444', lineHeight: 1.2, fontFamily: 'var(--font-mono, monospace)' }}>
              {formatDuree(totalArretMinutes)}
              <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500, marginLeft: '0.25rem' }}>
                ({Math.round(totalArretMinutes / 60)} h)
              </span>
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="text-muted">Chargement...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && filteredPannes.length === 0 && (
        <div className="empty-state">
          <p>Aucune panne trouvée pour la période sélectionnée.</p>
        </div>
      )}

      {!loading && !error && filteredPannes.length > 0 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Équipement</th>
                <th>Description</th>
                <th>Début (T_panne)</th>
                <th>Fin (T_reprise)</th>
                <th>Durée d'arrêt</th>
                <th>Impact</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPannes.map((p) => {
                const eq = equipementInfo(p.equipementId);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>{eq ? eq.codeEquipement : 'Inconnu'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{eq ? eq.designation : ''}</div>
                    </td>
                    <td style={{ maxWidth: '220px' }}>
                      <div style={{ fontSize: '0.8125rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.description}>
                        {p.description}
                      </div>
                    </td>
                    <td>{formatDate(p.tPanne)}</td>
                    <td>{formatDate(p.tReprise)}</td>
                    <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}>
                      {p.statut === 'OUVERTE'
                        ? <span style={{ color: '#d97706' }}>En cours</span>
                        : formatDuree(p.dureeArretMinutes)}
                    </td>
                    <td><span className={`badge ${impactBadgeClass(p.impact)}`}>{p.impact}</span></td>
                    <td><span className={`badge ${statutBadgeClass(p.statut)}`}>{p.statut}</span></td>
                    <td className="text-right">
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        {p.statut !== 'RESOLUE' && (
                          <button className="btn-action-icon" title="Clôturer la panne" style={{ color: '#10b981' }} onClick={() => openClose(p)}>
                            <CheckIcon size={16} />
                          </button>
                        )}
                        <button
                          className="btn-action-icon btn-edit"
                          title={p.statut === 'RESOLUE' ? 'Voir' : 'Détails'}
                          onClick={() => openView(p)}
                        >
                          {p.statut === 'RESOLUE' ? <EyeIcon size={16} /> : <EditIcon size={16} />}
                        </button>
                        {isSuperviseur && (
                          <button className="btn-action-icon btn-delete" title="Supprimer" onClick={() => setConfirmTarget({ type: 'one', row: p })}>
                            <TrashIcon size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale CREATE */}
      <Modal open={modalOpen && modalMode === 'create'} onClose={() => setModalOpen(false)} title="Déclarer une Panne">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Équipement en panne</label>
            <select className="form-control" required
              value={createForm.equipementId} onChange={(e) => setCreateForm({ ...createForm, equipementId: e.target.value })}>
              <option value="">-- Sélectionner un équipement --</option>
              {equipements.map((e) => <option key={e.id} value={e.id}>[{e.codeEquipement}] {e.designation}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">T_panne (Horodatage exact)</label>
            <input type="datetime-local" className="form-control" required
              value={createForm.tPanne} onChange={(e) => setCreateForm({ ...createForm, tPanne: e.target.value })} />
          </div>
          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Cause</label>
              <select className="form-control" value={createForm.causePanne} onChange={(e) => setCreateForm({ ...createForm, causePanne: e.target.value })}>
                {causes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group w-full">
              <label className="form-label">Impact</label>
              <select className="form-control" value={createForm.impact} onChange={(e) => setCreateForm({ ...createForm, impact: e.target.value })}>
                {impacts.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Description du problème</label>
            <textarea className="form-control" rows={2} required
              value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
          </div>
          {formError && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '1rem' }}>{formError}</p>}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* Modale CLOSE */}
      <Modal open={modalOpen && modalMode === 'close'} onClose={() => setModalOpen(false)} title="Clôturer la panne">
        {activePanne && (
          <form onSubmit={handleCloseSubmit}>
            <div className="form-group">
              <label className="form-label">Équipement</label>
              <input type="text" className="form-control" disabled value={equipementInfo(activePanne.equipementId)?.designation || '—'} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} disabled value={activePanne.description} />
            </div>
            <div className="form-group">
              <label className="form-label">T_reprise (remise en service)</label>
              <input type="datetime-local" className="form-control" required
                value={closeForm.tReprise} onChange={(e) => setCloseForm({ ...closeForm, tReprise: e.target.value })} />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Actions correctives <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optionnel)</span></label>
              <textarea className="form-control" rows={2}
                value={closeForm.actionsCorrectives} onChange={(e) => setCloseForm({ ...closeForm, actionsCorrectives: e.target.value })} />
            </div>
            {formError && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '1rem' }}>{formError}</p>}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary">Clôturer</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modale VIEW (lecture seule) */}
      <Modal open={modalOpen && modalMode === 'view'} onClose={() => setModalOpen(false)} title="Détails de la panne">
        {activePanne && (
          <div>
            <div className="form-group">
              <label className="form-label">Équipement</label>
              <input type="text" className="form-control" disabled value={equipementInfo(activePanne.equipementId)?.designation || '—'} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} disabled value={activePanne.description} />
            </div>
            <div className="flex gap-4">
              <div className="form-group w-full">
                <label className="form-label">Cause</label>
                <input type="text" className="form-control" disabled value={activePanne.causePanne} />
              </div>
              <div className="form-group w-full">
                <label className="form-label">Impact</label>
                <input type="text" className="form-control" disabled value={activePanne.impact} />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="form-group w-full">
                <label className="form-label">T_panne</label>
                <input type="text" className="form-control" disabled value={formatDate(activePanne.tPanne)} />
              </div>
              <div className="form-group w-full">
                <label className="form-label">T_reprise</label>
                <input type="text" className="form-control" disabled value={formatDate(activePanne.tReprise)} />
              </div>
            </div>
            {activePanne.actionsCorrectives && (
              <div className="form-group mb-0">
                <label className="form-label">Actions correctives</label>
                <textarea className="form-control" rows={2} disabled value={activePanne.actionsCorrectives} />
              </div>
            )}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Fermer</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmTarget}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmTarget?.type === 'all' ? confirmDeleteAll : confirmDeleteOne}
        title={confirmTarget?.type === 'all' ? 'Confirmer la suppression globale' : 'Confirmer la suppression'}
        message={
          confirmTarget?.type === 'all'
            ? 'Êtes-vous sûr de vouloir supprimer toutes les pannes ? Cette action est irréversible.'
            : 'Êtes-vous sûr de vouloir supprimer cette panne ?'
        }
        confirmLabel={confirmTarget?.type === 'all' ? 'Supprimer tout' : 'Supprimer'}
      />
    </div>
  );
}

export default PannesPage;