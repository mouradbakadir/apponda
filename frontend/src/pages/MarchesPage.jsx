import { useState } from 'react';
import { useCrud } from '../hooks/useCrud.js';
import { marchesApi } from '../services/marches.api.js';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { PlusIcon, EditIcon, TrashIcon, UploadCloudIcon, MarchesIcon } from '../components/icons.jsx';

const emptyForm = {
  numeroMarche: '', objet: '', typeMaintenance: 'MIXTE', statut: 'BROUILLON',
  slaDisponibilite: '', slaPrr: '', slaMrt: '', dateDebut: '', dateFin: '',
};

function formatDateFR(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString('fr-FR');
}

function statutBadgeClass(statut) {
  if (statut === 'ACTIF') return 'badge-success';
  if (statut === 'EXPIRE') return 'badge-warning';
  if (statut === 'RESILIE') return 'badge-danger';
  return 'badge-neutral';
}

function MarchesPage() {
  const { items, loading, error, create, update, remove } = useCrud(marchesApi);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null); // { type: 'one'|'all', row? }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      numeroMarche: row.numeroMarche,
      objet: row.objet,
      typeMaintenance: row.typeMaintenance,
      statut: row.statut,
      slaDisponibilite: row.slaDisponibilite,
      slaPrr: row.slaPrr,
      slaMrt: row.slaMrt,
      dateDebut: row.dateDebut.slice(0, 10),
      dateFin: row.dateFin.slice(0, 10),
    });
    setFormError('');
    setModalOpen(true);
  }

  function handleUploadClick(e) {
    e.stopPropagation();
    alert('La gestion documentaire des marchés (import PDF) sera disponible en Phase 3 du projet.');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const payload = {
      numeroMarche: form.numeroMarche,
      objet: form.objet,
      typeMaintenance: form.typeMaintenance,
      statut: form.statut,
      slaDisponibilite: Number(form.slaDisponibilite),
      slaPrr: Number(form.slaPrr),
      slaMrt: Number(form.slaMrt),
      dateDebut: form.dateDebut,
      dateFin: form.dateFin,
    };
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
      for (const row of items) {
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
          <h1>Marchés & Contrats</h1>
          <p>Gestion des contrats de maintenance par aéroport</p>
        </div>
        <div className="flex gap-2">
          {items.length > 0 && (
            <button
              className="btn btn-danger"
              onClick={() => setConfirmTarget({ type: 'all' })}
            >
              <TrashIcon size={16} />
              Supprimer tout
            </button>
          )}
          <button className="btn btn-primary" onClick={openCreate}>
            <PlusIcon size={20} />
            Nouveau Marché
          </button>
        </div>
      </div>

      {loading && <p className="text-muted">Chargement...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && (
        <div className="table-container">
          <div className="overflow-x-auto w-full">
            <table className="table" style={{ minWidth: '1000px' }}>
            <thead>
  <tr>
    <th>Numéro</th>
    <th>Objet</th>
    <th>SLO Disponibilité</th>
    <th>SLO PRR</th>
    <th>SLO MRT</th>
    <th>Document</th>
    <th>Statut</th>
    <th>Période</th>
    <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
  </tr>
</thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state" style={{ border: 'none', padding: '2.5rem 1.5rem' }}>
                        <MarchesIcon size={40} stroke="#cbd5e1" />
                        <p>Aucun marché ou contrat de maintenance configuré.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {items.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                      {m.numeroMarche}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#1e293b', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.objet}>
                        {m.objet}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                        Type : <span style={{ fontWeight: 500, color: '#475569' }}>{m.typeMaintenance}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', background: '#ecfdf5', color: '#059669', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {m.slaDisponibilite}%
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', background: '#f0f9ff', color: '#0284c7', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {m.slaPrr}%
                      </span>
                    </td>
                    <td>
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', background: '#f5f3ff', color: '#7c3aed', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
    {m.slaMrt} min
  </span>
</td>
                    <td>
                      <button
                        onClick={handleUploadClick}
                        title="Importer le contrat"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', background: 'transparent', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        <UploadCloudIcon size={14} />
                        <span>Ajouter PDF</span>
                      </button>
                    </td>
                    <td>
                      <span className={`badge ${statutBadgeClass(m.statut)}`}>{m.statut}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#475569', whiteSpace: 'nowrap' }}>
                      {formatDateFR(m.dateDebut)}<br /><span style={{ color: '#94a3b8' }}>au</span> {formatDateFR(m.dateFin)}
                    </td>
                    <td style={{ width: '120px' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <button className="btn-action-icon btn-edit" title="Éditer" onClick={() => openEdit(m)}>
  <EditIcon size={16} />
</button>
<button className="btn-action-icon btn-delete" title="Supprimer" onClick={() => setConfirmTarget({ type: 'one', row: m })}>
  <TrashIcon size={16} />
</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifier le Marché' : 'Nouveau Marché'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Numéro de Marché</label>
            <input type="text" className="form-control" placeholder="Ex: 014/24" required
              value={form.numeroMarche} onChange={(e) => setForm({ ...form, numeroMarche: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Objet de la maintenance</label>
            <textarea className="form-control" rows={3} placeholder="Ex: Maintenance des équipements..." required
              value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Statut</label>
            <select className="form-control" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
              <option value="BROUILLON">Brouillon</option>
              <option value="ACTIF">Actif</option>
              <option value="EXPIRE">Expiré</option>
              <option value="RESILIE">Résilié</option>
            </select>
          </div>

          <div className="nav-section" style={{ paddingLeft: 0 }}>Niveaux de Service (SLO)</div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Disponibilité (%)</label>
              <input type="number" className="form-control" min="0" max="100" step="0.1" placeholder="98" required
                value={form.slaDisponibilite} onChange={(e) => setForm({ ...form, slaDisponibilite: e.target.value })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">PRR (%)</label>
              <input type="number" className="form-control" min="0" max="100" step="0.1" placeholder="100" required
                value={form.slaPrr} onChange={(e) => setForm({ ...form, slaPrr: e.target.value })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">MRT (Minutes)</label>
              <input type="number" className="form-control" min="1" placeholder="420" required
                value={form.slaMrt} onChange={(e) => setForm({ ...form, slaMrt: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Date début</label>
              <input type="date" className="form-control" required
                value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">Date fin</label>
              <input type="date" className="form-control" required
                value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
            </div>
          </div>

          <div className="nav-section" style={{ paddingLeft: 0 }}>Document du Marché (PDF)</div>

          <div className="form-group">
            <div
              className="pdf-dropzone"
              onClick={() => alert('La gestion documentaire des marchés (import PDF) sera disponible en Phase 3 du projet.')}
            >
              <div className="pdf-dropzone-icon"><UploadCloudIcon size={24} /></div>
              <div className="pdf-dropzone-text">
                <strong>Glissez-déposez</strong> votre fichier PDF ici
              </div>
              <div className="pdf-dropzone-hint">ou cliquez pour sélectionner · PDF uniquement · Max 50 Mo</div>
            </div>
          </div>

          {formError && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{formError}</p>}

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
            ? 'Êtes-vous sûr de vouloir supprimer tous les marchés ? Cette action est irréversible.'
            : 'Êtes-vous sûr de vouloir supprimer cet élément ?'
        }
        confirmLabel={confirmTarget?.type === 'all' ? 'Supprimer tout' : 'Supprimer'}
      />
    </div>
  );
}

export default MarchesPage;