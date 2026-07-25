import { useState, useEffect } from 'react';
import { useCrud } from '../hooks/useCrud.js';
import { societesApi } from '../services/societes.api.js';
import { marchesApi } from '../services/marches.api.js';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { PlusIcon, EditIcon, TrashIcon } from '../components/icons.jsx';

const roles = ['Chef de Projet', 'Responsable Technique', 'Technicien', 'Contact Commercial'];

const emptyForm = {
  raisonSociale: '', marcheId: '', rcNumber: '', ice: '', adresse: '',
  telephone: '', emailContact: '', emailNotification: '',
  contactUrgenceNom: '', contactUrgenceTel: '',
};

const emptyMembre = { role: 'Chef de Projet', nom: '', email: '', telephone: '' };

function SocietesPage() {
  const { items, loading, error, create, update, remove } = useCrud(societesApi);
  const [marches, setMarches] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [membres, setMembres] = useState([]);
  const [formError, setFormError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    marchesApi.getAll().then((res) => setMarches(res.data || res));
  }, []);

  function marcheLabel(marcheId) {
    const m = marches.find((mm) => mm.id === marcheId);
    return m ? m.numeroMarche : 'Inconnu';
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMembres([{ ...emptyMembre }]);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      raisonSociale: row.raisonSociale,
      marcheId: row.marcheId,
      rcNumber: row.rcNumber,
      ice: row.ice,
      adresse: row.adresse,
      telephone: row.telephone,
      emailContact: row.emailContact,
      emailNotification: row.emailNotification,
      contactUrgenceNom: row.contactUrgenceNom,
      contactUrgenceTel: row.contactUrgenceTel,
    });
    setMembres(
      (row.membres || []).map((m) => ({ role: m.role, nom: m.nom, email: m.email, telephone: m.telephone }))
    );
    setFormError('');
    setModalOpen(true);
  }

  function addMembre() {
    setMembres([...membres, { ...emptyMembre }]);
  }

  function removeMembre(index) {
    setMembres(membres.filter((_, i) => i !== index));
  }

  function updateMembre(index, field, value) {
    const next = [...membres];
    next[index] = { ...next[index], [field]: value };
    setMembres(next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const payload = { ...form, membres };
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
          <h1>Sociétés Prestataires</h1>
          <p>Gestion des entreprises et de leurs équipes dynamiques</p>
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
            Nouvelle Société
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
                <th>Nom de la Société</th>
                <th>Marché Lié</th>
                <th>Membres de l'équipe</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={4} className="text-center">Aucune société trouvée.</td></tr>
              )}
              {items.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500, color: '#0f172a', verticalAlign: 'top' }}>{s.raisonSociale}</td>
                  <td style={{ verticalAlign: 'top' }}>
                    <span className="badge badge-info">{marcheLabel(s.marcheId)}</span>
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    {(!s.membres || s.membres.length === 0) ? (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>Aucun membre</span>
                    ) : (
                      s.membres.map((m) => (
                        <div key={m.id} className="mb-1">
                          <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{m.role}</span>
                          <span style={{ fontWeight: 500, fontSize: '0.85rem', marginLeft: '0.25rem' }}>{m.nom}</span>
                          <div className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                            {m.telephone} | {m.email}
                          </div>
                        </div>
                      ))
                    )}
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <button className="btn-action-icon btn-edit" title="Éditer" onClick={() => openEdit(s)}>
                        <EditIcon size={16} />
                      </button>
                      <button className="btn-action-icon btn-delete" title="Supprimer" onClick={() => setConfirmTarget({ type: 'one', row: s })}>
                      <TrashIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifier la Société' : 'Nouvelle Société'}>
        <form onSubmit={handleSubmit}>
          <div className="nav-section" style={{ paddingLeft: 0, marginTop: 0 }}>Informations Générales</div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Nom de la Société</label>
              <input type="text" className="form-control" required
                value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">Marché Associé</label>
              <select className="form-control" required
                value={form.marcheId} onChange={(e) => setForm({ ...form, marcheId: e.target.value })}>
                <option value="">-- Sélectionner un marché --</option>
                {marches.map((m) => (
                  <option key={m.id} value={m.id}>{m.numeroMarche} - {m.objet.substring(0, 30)}...</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">RC</label>
              <input type="text" className="form-control" required
                value={form.rcNumber} onChange={(e) => setForm({ ...form, rcNumber: e.target.value })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">ICE</label>
              <input type="text" className="form-control" required
                value={form.ice} onChange={(e) => setForm({ ...form, ice: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adresse</label>
            <input type="text" className="form-control" required
              value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          </div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Téléphone</label>
              <input type="tel" className="form-control" required
                value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">Email de contact</label>
              <input type="email" className="form-control" required
                value={form.emailContact} onChange={(e) => setForm({ ...form, emailContact: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Email de notification</label>
              <input type="email" className="form-control" required
                value={form.emailNotification} onChange={(e) => setForm({ ...form, emailNotification: e.target.value })} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">Contact urgence (nom)</label>
              <input type="text" className="form-control" required
                value={form.contactUrgenceNom} onChange={(e) => setForm({ ...form, contactUrgenceNom: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contact urgence (téléphone)</label>
            <input type="tel" className="form-control" required
              value={form.contactUrgenceTel} onChange={(e) => setForm({ ...form, contactUrgenceTel: e.target.value })} />
          </div>

          <div className="flex justify-between items-center mt-6 mb-4">
            <div className="nav-section" style={{ padding: 0, margin: 0 }}>Équipe Intervenante</div>
            <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }} onClick={addMembre}>
              + Ajouter un membre
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {membres.map((membre, index) => (
              <div key={index} className="card" style={{ padding: '1rem', border: '1px solid #e2e8f0', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => removeMembre(index)}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                >
                  ✕
                </button>
                <div className="flex gap-4 mb-3">
                  <div className="form-group w-full mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Rôle</label>
                    <select className="form-control" required
                      value={membre.role} onChange={(e) => updateMembre(index, 'role', e.target.value)}>
                      {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group w-full mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Nom complet</label>
                    <input type="text" className="form-control" required
                      value={membre.nom} onChange={(e) => updateMembre(index, 'nom', e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="form-group w-full mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Email</label>
                    <input type="email" className="form-control" required
                      value={membre.email} onChange={(e) => updateMembre(index, 'email', e.target.value)} />
                  </div>
                  <div className="form-group w-full mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Téléphone</label>
                    <input type="tel" className="form-control" required
                      value={membre.telephone} onChange={(e) => updateMembre(index, 'telephone', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
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
            ? 'Êtes-vous sûr de vouloir supprimer toutes les sociétés ? Cette action est irréversible.'
            : 'Êtes-vous sûr de vouloir supprimer cet élément ?'
        }
        confirmLabel={confirmTarget?.type === 'all' ? 'Supprimer tout' : 'Supprimer'}
      />
    </div>
  );
}

export default SocietesPage;