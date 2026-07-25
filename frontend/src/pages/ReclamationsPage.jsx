import { useState, useEffect } from 'react';
import { useCrud } from '../hooks/useCrud.js';
import { reclamationsApi } from '../services/reclamations.api.js';
import { pannesApi } from '../services/pannes.api.js';
import { equipementsApi } from '../services/equipements.api.js';
import { societesApi } from '../services/societes.api.js';
import { marchesApi } from '../services/marches.api.js';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EmailPanel from '../components/EmailPanel.jsx';
import { PlusIcon, EditIcon, TrashIcon, MailIcon } from '../components/icons.jsx';
import PeriodFilter, { isDateInYearPeriod } from '../components/PeriodFilter.jsx';

const emptyForm = { panneId: '', tNotification: '', statut: 'NOUVELLE', tArrivee: '', objet: '', commentaire: '' };

function formatDateFR(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d) ? '-' : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatMRT(mins) {
  if (mins === null || mins === undefined) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function statutBadgeClass(statut) {
  if (statut === 'NOUVELLE') return 'badge-danger';
  if (statut === 'EN_COURS') return 'badge-warning';
  if (statut === 'RESOLUE') return 'badge-success';
  return 'badge-neutral';
}

function statutLabel(statut) {
  if (statut === 'NOUVELLE') return 'Nouvelle / Ouverte';
  if (statut === 'EN_COURS') return 'En cours';
  if (statut === 'RESOLUE') return 'Résolue';
  return statut;
}

function ReclamationsPage() {
  const { items, loading, error, create, update, remove } = useCrud(reclamationsApi);
  const [pannes, setPannes] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [marches, setMarches] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);

  useEffect(() => {
    pannesApi.getAll().then((res) => setPannes(res.data || res));
    equipementsApi.getAll().then((res) => setEquipements(res.data || res));
    societesApi.getAll().then((res) => setSocietes(res.data || res));
    marchesApi.getAll().then((res) => setMarches(res.data || res));
  }, []);

  function panneInfo(panneId) {
    const panne = pannes.find((p) => p.id === panneId);
    if (!panne) return null;
    const eq = equipements.find((e) => e.id === panne.equipementId);
    const societe = eq ? societes.find((s) => s.id === eq.societeId) : null;
    const marche = eq ? marches.find((m) => m.id === eq.marcheId) : null;
    return { panne, equipement: eq, societe, marche };
  }

  function equipementLabel(panneId) {
    const info = panneInfo(panneId);
    return info?.equipement ? `${info.equipement.codeEquipement} — ${info.equipement.designation}` : 'Inconnu';
  }

  function societeLabel(panneId) {
    const info = panneInfo(panneId);
    return info?.societe ? info.societe.raisonSociale : '-';
  }

  const filteredItems = items.filter((r) => isDateInYearPeriod(r.tNotification, year, period));

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, tNotification: new Date().toISOString().slice(0, 16) });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      panneId: row.panneId,
      tNotification: row.tNotification.slice(0, 16),
      statut: row.statut,
      tArrivee: row.tArrivee ? row.tArrivee.slice(0, 16) : '',
      objet: row.objet || '',
      commentaire: row.commentaire || '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const payload = {
      panneId: form.panneId,
      tNotification: new Date(form.tNotification).toISOString(),
      statut: form.statut,
      moyenNotification: 'APPLICATION', // valeur par defaut, champ retire de l'UI
    };
    if (form.tArrivee) payload.tArrivee = new Date(form.tArrivee).toISOString();
    if (form.objet) payload.objet = form.objet;
    if (form.commentaire) payload.commentaire = form.commentaire;
    try {
      if (editingId) await update(editingId, payload);
      else await create(payload);
      setModalOpen(false);
    } catch (err) {
      const details = err.response?.data?.error?.details;
      setFormError(details ? details.map((d) => `${d.champ}: ${d.message}`).join(' | ') : err.response?.data?.error?.message || 'Erreur');
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1>Gestion des Réclamations</h1>
          <p className="mb-0">Suivi et traitement des réclamations avec calcul du MRT</p>
        </div>
        <div className="flex gap-2">
          {filteredItems.length > 0 && (
            <button className="btn btn-danger" onClick={() => setConfirmTarget({ type: 'all' })}>
              <TrashIcon size={16} />
              Supprimer tout
            </button>
          )}
          <button className="btn btn-secondary" style={{ gap: '0.5rem' }} onClick={() => setEmailPanelOpen(true)}>
            <MailIcon size={16} />
            Générer un Email
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            <PlusIcon size={16} />
            Nouvelle Réclamation
          </button>
        </div>
      </div>

      <div className="card mb-6" style={{ padding: '0.75rem 1.25rem' }}>
        <div className="flex gap-4 items-center">
          <PeriodFilter year={year} onYearChange={setYear} period={period} onPeriodChange={setPeriod} />
        </div>
      </div>

      {loading && <p className="text-muted">Chargement...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="empty-state">
          <p>Aucune réclamation trouvée pour la période sélectionnée.</p>
        </div>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <div className="table-container">
          <div className="overflow-x-auto w-full">
            <table className="table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>Date signalement</th>
                  <th>Panne / Objet</th>
                  <th>Société</th>
                  <th>Statut</th>
                  <th>MRT</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((r) => {
                  const mrt = formatMRT(r.tempsReactionMinutes);
                  return (
                    <tr key={r.id}>
                      <td>{formatDateFR(r.tNotification)}</td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#0f172a', marginBottom: '0.125rem' }}>{r.objet || 'Sans objet'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Éq: {equipementLabel(r.panneId)}</div>
                      </td>
                      <td>{societeLabel(r.panneId)}</td>
                      <td><span className={`badge ${statutBadgeClass(r.statut)}`}>{statutLabel(r.statut)}</span></td>
                      <td>
                        {mrt
                          ? <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}>{mrt}</span>
                          : <span style={{ fontStyle: 'italic', fontSize: '0.8125rem', color: '#94a3b8' }}>En attente d'arrivée...</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                          <button className="btn-action-icon btn-edit" title="Éditer" onClick={() => openEdit(r)}>
                            <EditIcon size={16} />
                          </button>
                          <button className="btn-action-icon btn-delete" title="Supprimer" onClick={() => setConfirmTarget({ type: 'one', row: r })}>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Éditer la Réclamation' : 'Nouvelle Réclamation'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Panne associée</label>
            <select className="form-control" required
              value={form.panneId} onChange={(e) => setForm({ ...form, panneId: e.target.value })}>
              <option value="">-- Sélectionner une panne associée --</option>
              {pannes.map((p) => {
                const eq = equipements.find((e) => e.id === p.equipementId);
                return (
                  <option key={p.id} value={p.id}>
                    Panne du {new Date(p.tPanne).toLocaleDateString('fr-FR')} - Éq: {eq ? eq.codeEquipement : 'Inconnu'} ({p.statut})
                  </option>
                );
              })}
            </select>
            {form.panneId && (
              <div className="mt-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem', fontSize: '0.8125rem' }}>
                {(() => {
                  const info = panneInfo(form.panneId);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div><span style={{ color: '#64748b', fontWeight: 500 }}>Équipement :</span> {info?.equipement ? `${info.equipement.codeEquipement} - ${info.equipement.designation}` : '-'}</div>
                      <div><span style={{ color: '#64748b', fontWeight: 500 }}>Marché :</span> {info?.marche ? `${info.marche.numeroMarche} - ${info.marche.objet}` : '-'}</div>
                      <div><span style={{ color: '#64748b', fontWeight: 500 }}>Société :</span> <strong>{info?.societe ? info.societe.raisonSociale : '-'}</strong></div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Date et Heure du signalement</label>
              <input type="datetime-local" className="form-control" required
                value={form.tNotification} onChange={(e) => setForm({ ...form, tNotification: e.target.value })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">Statut</label>
              <select className="form-control" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                <option value="NOUVELLE">Nouvelle / Ouverte</option>
                <option value="EN_COURS">En cours</option>
                <option value="RESOLUE">Résolue</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Date et Heure d'arrivée de la société <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optionnel)</span>
            </label>
            <input type="datetime-local" className="form-control"
              value={form.tArrivee} onChange={(e) => setForm({ ...form, tArrivee: e.target.value })} />
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Ce champ peut être rempli plus tard. Nécessaire pour le calcul du MRT.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Objet <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optionnel)</span>
            </label>
            <input type="text" className="form-control" placeholder="Ex: Retard d'intervention, mauvaise exécution..."
              value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} />
          </div>

          <div className="form-group mb-0">
            <label className="form-label">
              Description détaillée <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optionnel)</span>
            </label>
            <textarea className="form-control" rows={3} placeholder="Détails de la réclamation..."
              value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} />
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
            ? 'Êtes-vous sûr de vouloir supprimer toutes les réclamations ? Cette action est irréversible.'
            : 'Êtes-vous sûr de vouloir supprimer cette réclamation ?'
        }
        confirmLabel={confirmTarget?.type === 'all' ? 'Supprimer tout' : 'Supprimer'}
      />

      <EmailPanel
        open={emailPanelOpen}
        onClose={() => setEmailPanelOpen(false)}
        reclamations={items}
        equipementLabel={equipementLabel}
        societeLabel={societeLabel}
      />
    </div>
  );
}

export default ReclamationsPage;