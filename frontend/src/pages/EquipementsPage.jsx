import { useState, useEffect } from 'react';
import { useCrud } from '../hooks/useCrud.js';
import { equipementsApi } from '../services/equipements.api.js';
import { marchesApi } from '../services/marches.api.js';
import { societesApi } from '../services/societes.api.js';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { PlusIcon, EditIcon, TrashIcon } from '../components/icons.jsx';

const categories = ['ELECTRIQUE', 'MECANIQUE', 'CVC', 'INCENDIE', 'BALISAGE', 'PASSERELLE', 'ASCENSEUR', 'AUTRE'];
const statuts = ['EN_SERVICE', 'EN_MAINTENANCE', 'EN_PANNE', 'HORS_SERVICE'];

const emptyForm = {
  codeEquipement: '', designation: '', localisation: '', categorie: 'ELECTRIQUE',
  statut: 'EN_SERVICE', marcheId: '', societeId: '',
};

function statutBadgeClass(statut) {
  if (statut === 'EN_SERVICE') return 'badge-success';
  if (statut === 'EN_PANNE') return 'badge-danger';
  if (statut === 'EN_MAINTENANCE') return 'badge-warning';
  return 'badge-neutral';
}

function EquipementsPage() {
  const { items, loading, error, create, update, remove } = useCrud(equipementsApi);
  const [marches, setMarches] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    marchesApi.getAll().then((res) => setMarches(res.data || res));
    societesApi.getAll().then((res) => setSocietes(res.data || res));
  }, []);

   const societesFiltrees = form.marcheId
    ? societes.filter((s) => s.marcheId === form.marcheId)
    : [];

  function marcheLabel(marcheId) {
    const m = marches.find((mm) => mm.id === marcheId);
    return m ? m.numeroMarche : 'Non assigné';
  }

  function societeLabel(societeId) {
    const s = societes.find((ss) => ss.id === societeId);
    return s ? s.raisonSociale : null;
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      codeEquipement: row.codeEquipement,
      designation: row.designation,
      localisation: row.localisation,
      categorie: row.categorie,
      statut: row.statut,
      marcheId: row.marcheId,
      societeId: row.societeId,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    try {
      if (editingId) await update(editingId, form);
      else await create(form);
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
          <h1>Équipements & Installations</h1>
          <p>Parc matériel sous contrat de maintenance</p>
        </div>
        <div className="flex gap-2">
          {items.length > 0 && (
            <button className="btn btn-danger" onClick={() => setConfirmTarget({ type: 'all' })}>
              <TrashIcon size={16} />
              Supprimer tout
            </button>
          )}
          <button className="btn btn-primary" onClick={openCreate}>
            <PlusIcon size={16} />
            Nouvel Équipement
          </button>
        </div>
      </div>

      {loading && <p className="text-muted">Chargement...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nom de l'équipement</th>
                <th>Désignation</th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th>Marché en charge</th>
                <th>Prestataire</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={7} className="text-center">Aucun équipement trouvé.</td></tr>
              )}
              {items.map((e) => {
                const societeName = societeLabel(e.societeId);
                return (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500, color: '#0f172a', verticalAlign: 'middle' }}>{e.codeEquipement}</td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 500 }}>{e.designation}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{e.localisation || 'Non renseignée'}</div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className="badge badge-neutral">{e.categorie}</span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className={`badge ${statutBadgeClass(e.statut)}`}>{e.statut.replace('_', ' ')}</span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className="badge badge-info">{marcheLabel(e.marcheId)}</span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      {societeName || <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Non assigné</span>}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button className="btn-action-icon btn-edit" title="Éditer" onClick={() => openEdit(e)}>
                          <EditIcon size={16} />
                        </button>
                        <button className="btn-action-icon btn-delete" title="Supprimer" onClick={() => setConfirmTarget({ type: 'one', row: e })}>
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
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Modifier l'Équipement" : 'Nouvel Équipement'}>
        <form onSubmit={handleSubmit}>
          <div className="nav-section" style={{ paddingLeft: 0, marginTop: 0 }}>Identification</div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Nom de l'équipement</label>
              <input type="text" className="form-control" placeholder="Ex: EQ-CVC-001" required
                value={form.codeEquipement} onChange={(e) => setForm({ ...form, codeEquipement: e.target.value })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">Désignation</label>
              <input type="text" className="form-control" placeholder="Ex: Climatiseur central" required
                value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Localisation / Emplacement</label>
              <input type="text" className="form-control" required
                value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">Catégorie</label>
              <select className="form-control" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="nav-section" style={{ paddingLeft: 0 }}>Paramètres & Maintenance</div>

          <div className="form-group w-full mb-4">
            <label className="form-label">Statut Actuel</label>
            <select className="form-control" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
              {statuts.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>

          <div className="flex gap-4 items-center">
            <div className="form-group w-full">
              <label className="form-label">Marché en charge</label>
              <select className="form-control" required
                value={form.marcheId} onChange={(e) => setForm({ ...form, marcheId: e.target.value, societeId: '' })}>
                <option value="">-- Sélectionner un marché --</option>
                {marches.map((m) => <option key={m.id} value={m.id}>{m.numeroMarche}</option>)}
              </select>
            </div>
            <div className="form-group w-full">
              <label className="form-label">Prestataire en charge</label>
              <select className="form-control" required disabled={!form.marcheId}
                value={form.societeId} onChange={(e) => setForm({ ...form, societeId: e.target.value })}>
                <option value="">
                  {form.marcheId ? '-- Sélectionner un prestataire --' : 'Sélectionnez d\'abord un marché'}
                </option>
                {societesFiltrees.map((s) => <option key={s.id} value={s.id}>{s.raisonSociale}</option>)}
              </select>
              {form.marcheId && societesFiltrees.length === 0 && (
                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Aucune société liée à ce marché — crée-la d'abord depuis la page Sociétés.
                </p>
              )}
            </div>
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
            ? 'Êtes-vous sûr de vouloir supprimer tous les équipements ? Cette action est irréversible.'
            : 'Êtes-vous sûr de vouloir supprimer cet élément ?'
        }
        confirmLabel={confirmTarget?.type === 'all' ? 'Supprimer tout' : 'Supprimer'}
      />
    </div>
  );
}

export default EquipementsPage;