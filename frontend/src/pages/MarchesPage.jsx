import { useState } from 'react';
import { useCrud } from '../hooks/useCrud.js';
import { usePdfExtraction } from '../hooks/usePdfExtraction.js';
import { marchesApi } from '../services/marches.api.js';
import { marcheDocumentsApi } from '../services/marcheDocuments.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAirport } from '../context/AirportContext.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import UploadProgress from '../components/UploadProgress.jsx';
import { minutesToHeures, heuresToMinutes, formatHeures } from '../utils/duration.js';
import { PlusIcon, EditIcon, TrashIcon, UploadCloudIcon, MarchesIcon, EyeIcon } from '../components/icons.jsx';
import PdfViewerModal from '../components/PdfViewerModal.jsx';

const emptyForm = {
  airportId: '', numeroMarche: '', objet: '', typeMaintenance: 'MIXTE', statut: 'BROUILLON',
  // slaMrt est saisi en HEURES dans ce formulaire (les contrats sont
  // redigés en heures), puis converti en minutes pour l'API au moment de
  // l'envoi. Voir utils/duration.js.
  slaDisponibilite: '', slaPrr: '', slaMrt: '', dateDebut: '', dateFin: '',
};

function formatDateFR(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString('fr-FR');
}
function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function statutBadgeClass(statut) {
  if (statut === 'ACTIF') return 'badge-success';
  if (statut === 'EXPIRE') return 'badge-warning';
  if (statut === 'RESILIE') return 'badge-danger';
  return 'badge-neutral';
}

function MarchesPage() {
  const { user } = useAuth();
  const { airports, selectedAirportId } = useAirport();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { items, loading, error, create, update, remove, refetch } = useCrud(marchesApi);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null); // { type: 'one'|'all', row? }
  // Document affiché dans le lecteur PDF intégré : { id, name } | null
  const [pdfViewerTarget, setPdfViewerTarget] = useState(null);

  // CAS 1 : PDF ajouté pendant la création -- extraction IA OPTIONNELLE,
  // jamais déclenchée automatiquement au dépôt du fichier.
  const pdfExtraction = usePdfExtraction();
  

  // Ajout d'un document à un marché déjà existant -- simple archivage,
  // aucune extraction IA, aucune comparaison, aucun pré-remplissage.
  const [addDocTarget, setAddDocTarget] = useState(null); // { row } | null
  const [addDocStatus, setAddDocStatus] = useState('idle'); // idle | uploading | done | error
  const [addDocError, setAddDocError] = useState('');
  const [addDocProgress, setAddDocProgress] = useState(0); // progression du transfert, 0 a 100

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, airportId: isSuperAdmin && selectedAirportId !== 'all' ? selectedAirportId : '' });
    setFormError('');
    pdfExtraction.reset();
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      airportId: row.airportId,
      numeroMarche: row.numeroMarche,
      objet: row.objet,
      typeMaintenance: row.typeMaintenance,
      statut: row.statut,
      slaDisponibilite: row.slaDisponibilite,
      slaPrr: row.slaPrr,
      slaMrt: minutesToHeures(row.slaMrt),
      dateDebut: row.dateDebut.slice(0, 10),
      dateFin: row.dateFin.slice(0, 10),
    });
    setFormError('');
    pdfExtraction.reset();
    setModalOpen(true);
  }

  // --- CAS 1 : le dépôt de fichier ne fait QUE mémoriser le fichier -------
  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (isSuperAdmin && !form.airportId) {
      setFormError("Sélectionnez d'abord un aéroport avant d'ajouter le PDF.");
      return;
    }

    setFormError('');
    // Le fichier est réellement envoyé et sauvegardé dès le dépôt
    // (autoExtract: false) -- il ne sera plus jamais perdu si l'utilisateur
    // enregistre sans avoir cliqué sur "Extraire".
    try {
      await pdfExtraction.upload(file, {
        airportId: isSuperAdmin ? form.airportId : undefined,
        autoExtract: false,
      });
    } catch {
      // erreur déjà exposée par pdfExtraction.error
    }
  }

 function handleLaunchExtraction() {
    if (!pdfExtraction.document?.id) return;
    pdfExtraction.startExtraction(pdfExtraction.document.id);
  }

  // Dès que l'extraction CAS 1 se termine SANS problème d'aéroport, on
  // pré-remplit le formulaire -- l'utilisateur reste entièrement libre de
  // tout corriger avant d'enregistrer.
  if (pdfExtraction.status === 'done' && pdfExtraction.document?.extractedJson && !editingId) {
    const extracted = pdfExtraction.document.extractedJson;
    const shouldPrefill = form.numeroMarche === '' && form.objet === '' && !pdfExtraction.document.airportMismatch;
    if (shouldPrefill) {
      setForm((prev) => ({
        ...prev,
        numeroMarche: extracted.numeroMarche ?? prev.numeroMarche,
        objet: extracted.objet ?? prev.objet,
        typeMaintenance: extracted.typeMaintenance ?? prev.typeMaintenance,
        slaDisponibilite: extracted.slaDisponibilite ?? prev.slaDisponibilite,
        slaPrr: extracted.slaPrr ?? prev.slaPrr,
        slaMrt: extracted.slaMrt != null ? minutesToHeures(extracted.slaMrt) : prev.slaMrt,
        dateDebut: extracted.dateDebut ?? prev.dateDebut,
        dateFin: extracted.dateFin ?? prev.dateFin,
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (isSuperAdmin && !form.airportId) {
      setFormError("L'aéroport est obligatoire.");
      return;
    }

    const payload = {
      numeroMarche: form.numeroMarche,
      objet: form.objet,
      typeMaintenance: form.typeMaintenance,
      statut: form.statut,
      slaDisponibilite: Number(form.slaDisponibilite),
      slaPrr: Number(form.slaPrr),
      slaMrt: heuresToMinutes(form.slaMrt),
      dateDebut: form.dateDebut,
      dateFin: form.dateFin,
    };
    if (isSuperAdmin) payload.airportId = form.airportId;

    try {
      if (editingId) {
        await update(editingId, payload);
      } else {
        const nouveauMarche = await create(payload);
        // Si un PDF a été extrait pendant la création (bouton cliqué), on le
        // relie maintenant au marché qui vient d'être réellement créé.
        if (pdfExtraction.document?.id) {
          await marcheDocumentsApi.attach(pdfExtraction.document.id, nouveauMarche.id).catch(() => {
            // Non bloquant : le marché est créé avec succès même si le
            // rattachement du document échoue.
          });
          // NOUVEAU : create() a déjà rafraîchi le tableau, mais AVANT que
          // le document ne soit rattaché (l'attach se fait juste au-dessus,
          // après coup). Sans ce second rafraîchissement, le tableau reste
          // figé sur l'état "sans document" même si le rattachement a
          // réussi en base.
          await refetch();
        }
      }
      setModalOpen(false);
    } catch (err) {
      const details = err.response?.data?.error?.details;
      setFormError(
        details ? details.map((d) => `${d.champ}: ${d.message}`).join(' | ')
                : err.response?.data?.error?.message || 'Erreur'
      );
    }
  }

  // --- Ajout d'un document à un marché existant (simple archivage) --------
  function openAddDocument(row) {
    setAddDocTarget({ row });
    setAddDocStatus('idle');
    setAddDocError('');
    setAddDocProgress(0);
  }

  function closeAddDocument() {
    setAddDocTarget(null);
    setAddDocStatus('idle');
    setAddDocError('');
    setAddDocProgress(0);
  }

  async function handleFileSelectedCaseTwo(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !addDocTarget) return;

    setAddDocStatus('uploading');
    setAddDocError('');
    setAddDocProgress(0);
    try {
      await marcheDocumentsApi.upload(file, {
        marcheId: addDocTarget.row.id,
        onProgress: setAddDocProgress,
      });
      setAddDocStatus('done');
      refetch(); // NOUVEAU : le tableau doit refléter le document tout de suite
    } catch (err) {
      setAddDocStatus('error');
      setAddDocError(err.response?.data?.error?.message || "Erreur lors de l'ajout du document");
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
            <button className="btn btn-danger" onClick={() => setConfirmTarget({ type: 'all' })}>
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
                        {formatHeures(m.slaMrt)}
                      </span>
                    </td>
                    <td>
                      {m.documents && m.documents.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.625rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', maxWidth: '230px' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                          </svg>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.documents[0].originalName}>
                              {m.documents[0].originalName}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{formatFileSize(m.documents[0].sizeBytes)}</div>
                          </div>
                          <button type="button" title="Lire le document" onClick={() => setPdfViewerTarget({ id: m.documents[0].id, name: m.documents[0].originalName })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.125rem', flexShrink: 0 }}>
                            <EyeIcon size={16} />
                          </button>
                          <button type="button" title="Télécharger" onClick={() => marcheDocumentsApi.download(m.documents[0].id, m.documents[0].originalName)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.125rem', flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                          <button type="button" title="Remplacer le document" onClick={() => openAddDocument(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.125rem', flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label
                          title="Importer le contrat"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', background: 'transparent', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}
                          onClick={() => openAddDocument(m)}
                        >
                          <UploadCloudIcon size={14} />
                          <span>Ajouter PDF</span>
                        </label>
                      )}
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
          {isSuperAdmin && (
            <div className="form-group">
              <label className="form-label">Aéroport</label>
              <select
                className="form-control"
                required
                disabled={!!editingId}
                value={form.airportId}
                onChange={(e) => setForm({ ...form, airportId: e.target.value })}
              >
                <option value="">Sélectionner un aéroport…</option>
                {airports.map((a) => (
                  <option key={a.id} value={a.id}>{a.codeIata} - {a.nom}</option>
                ))}
              </select>
            </div>
          )}

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

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Statut</label>
              <select className="form-control" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                <option value="BROUILLON">Brouillon</option>
                <option value="ACTIF">Actif</option>
                <option value="EXPIRE">Expiré</option>
                <option value="RESILIE">Résilié</option>
              </select>
            </div>
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
              <label className="form-label">MRT (Heures)</label>
              {/* step="any" et non "0.5" : les marchés déjà enregistrés peuvent
                  contenir un nombre de minutes qui ne tombe pas sur une
                  demi-heure (ex: 425 min = 7,08 h). Avec un step fixe, le
                  navigateur refuserait de soumettre ces valeurs existantes. */}
              <input type="number" className="form-control" min="0.01" step="any" placeholder="7" required
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

          {!editingId && (
            <>
              <div className="nav-section" style={{ paddingLeft: 0 }}>Document du Marché (PDF) — optionnel</div>

              <div className="form-group">
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginBottom: '0.75rem' }}
                  disabled={!pdfExtraction.document?.id || pdfExtraction.status === 'uploading' || pdfExtraction.status === 'polling'}
                  onClick={handleLaunchExtraction}
                >
                   Extraire les informations via IA (optionnel)
                </button>
                {!pdfExtraction.document?.id && (
                  <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '-0.5rem', marginBottom: '0.75rem' }}>
                    Sélectionnez d'abord un fichier PDF ci-dessous pour activer ce bouton.
                  </p>
                )}

                <label
                  htmlFor="pdf-upload-input"
                  className="pdf-dropzone"
                  style={{ cursor: isSuperAdmin && !form.airportId ? 'not-allowed' : 'pointer', opacity: isSuperAdmin && !form.airportId ? 0.5 : 1 }}
                >
                  <div className="pdf-dropzone-icon"><UploadCloudIcon size={24} /></div>
                  <div className="pdf-dropzone-text">
                    <strong>Glissez-déposez</strong> votre fichier PDF ici
                  </div>
                  <div className="pdf-dropzone-hint">
                    {isSuperAdmin && !form.airportId
                      ? 'Sélectionnez un aéroport avant d\'ajouter le PDF'
                      : pdfExtraction.document
                        ? `Fichier enregistré : ${pdfExtraction.document.originalName}`
                        : 'ou cliquez pour sélectionner · PDF uniquement · Max 50 Mo'}
                  </div>
                </label>
                <input
                  id="pdf-upload-input"
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  disabled={isSuperAdmin && !form.airportId}
                  onChange={handleFileSelected}
                />

                {pdfExtraction.status === 'uploading' && <UploadProgress percent={pdfExtraction.uploadProgress} label="Envoi du PDF" />}
                {pdfExtraction.status === 'polling' && <p className="text-muted" style={{ marginTop: '0.5rem' }}>{pdfExtraction.progressMessage}</p>}
                {pdfExtraction.status === 'done' && pdfExtraction.document?.airportMismatch && (
                  <p style={{ color: '#dc2626', marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    ⚠️ Ce document ne semble pas concerner votre aéroport — le formulaire n'a PAS été pré-rempli automatiquement. Vérifiez que vous avez uploadé le bon marché.
                  </p>
                )}
                {pdfExtraction.status === 'done' && !pdfExtraction.document?.airportMismatch && (
                  <p style={{ color: '#059669', marginTop: '0.5rem', fontSize: '0.875rem' }}>✓ Formulaire pré-rempli à partir du PDF — vérifiez et corrigez si besoin avant d'enregistrer.</p>
                )}
                {pdfExtraction.status === 'error' && <p style={{ color: '#dc2626', marginTop: '0.5rem', fontSize: '0.875rem' }}>{pdfExtraction.error}</p>}
              </div>
            </>
          )}

          {formError && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{formError}</p>}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* Ajout d'un document à un marché existant -- simple archivage */}
      <Modal open={!!addDocTarget} onClose={closeAddDocument} title={`Ajouter un document — ${addDocTarget?.row?.numeroMarche || ''}`}>
        <label htmlFor="pdf-upload-case2" className="pdf-dropzone" style={{ cursor: 'pointer' }}>
          <div className="pdf-dropzone-icon"><UploadCloudIcon size={24} /></div>
          <div className="pdf-dropzone-text"><strong>Glissez-déposez</strong> votre fichier PDF ici</div>
          <div className="pdf-dropzone-hint">ou cliquez pour sélectionner · PDF uniquement · Max 50 Mo</div>
        </label>
        <input id="pdf-upload-case2" type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileSelectedCaseTwo} disabled={addDocStatus === 'uploading'} />

        {addDocStatus === 'uploading' && <UploadProgress percent={addDocProgress} label="Envoi du document" />}
        {addDocStatus === 'done' && <p style={{ color: '#059669', marginTop: '0.5rem', fontSize: '0.875rem' }}>✓ Document ajouté avec succès au marché.</p>}
        {addDocStatus === 'error' && <p style={{ color: '#dc2626', marginTop: '0.5rem', fontSize: '0.875rem' }}>{addDocError}</p>}

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={closeAddDocument}>
            {addDocStatus === 'done' ? 'Fermer' : 'Annuler'}
          </button>
        </div>
      </Modal>

      {pdfViewerTarget && (
        <PdfViewerModal
          documentId={pdfViewerTarget.id}
          filename={pdfViewerTarget.name}
          onClose={() => setPdfViewerTarget(null)}
        />
      )}

      <ConfirmModal
        open={!!confirmTarget}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmTarget?.type === 'all' ? confirmDeleteAll : confirmDeleteOne}
        title={confirmTarget?.type === 'all' ? 'Confirmer la suppression globale' : 'Confirmer la suppression'}
         message={
          confirmTarget?.type === 'all'
            ? 'Êtes-vous sûr de vouloir supprimer tous les marchés ? Cette action supprime aussi définitivement leurs équipements, sociétés, pannes, réclamations et documents. Cette action est irréversible.'
            : 'Êtes-vous sûr de vouloir supprimer ce marché ? Cette action supprime aussi définitivement ses équipements, sociétés, pannes, réclamations et documents associés.'
        }
        confirmLabel={confirmTarget?.type === 'all' ? 'Supprimer tout' : 'Supprimer'}
      />
    </div>
  );
}

export default MarchesPage;