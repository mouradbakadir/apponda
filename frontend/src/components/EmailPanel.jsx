import { useState } from 'react';
import { MailIcon, CopyIcon, SendIcon } from './icons.jsx';

const emailTypes = [
  { value: 'NOTIF_PANNE', label: "Demande d'intervention (Courte)" },
  { value: 'NOTIF_PANNE_DET', label: "Demande d'intervention (Formelle)" },
  { value: 'RELANCE_1', label: 'Première relance (Retard)' },
  { value: 'RELANCE_2', label: 'Deuxième relance (Mise en garde)' },
  { value: 'NON_CONFORMITE', label: 'Constat de non-conformité' },
  { value: 'PENALITES', label: 'Notification de pénalités' },
  { value: 'MISE_EN_DEMEURE', label: 'Mise en demeure' },
];

function EmailPanel({ open, onClose, reclamations, equipementLabel, societeLabel }) {
  const [selectedRecId, setSelectedRecId] = useState('');
  const [emailType, setEmailType] = useState('NOTIF_PANNE');
  const [urgence, setUrgence] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [signataire, setSignataire] = useState('');
  const [fonction, setFonction] = useState('Chef de Division Maintenance');

  if (!open) return null;

  const selectedRec = reclamations.find((r) => r.id === selectedRecId);

  function handleGenerate() {
    alert("La génération automatique du contenu d'email (IA) sera disponible en Phase 4 du projet. Cette interface est prête à l'accueillir.");
  }

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 998 }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: '480px', maxWidth: '95vw',
        background: 'white', zIndex: 999, boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.0625rem' }}>
            <MailIcon size={20} />
            Générer un Email Professionnel
          </h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <div className="form-group">
            <label className="form-label">Réclamation liée</label>
            <select className="form-control" value={selectedRecId} onChange={(e) => setSelectedRecId(e.target.value)}>
              <option value="">— Sélectionnez une réclamation —</option>
              {reclamations.map((r) => (
                <option key={r.id} value={r.id}>
                  {new Date(r.tNotification).toLocaleDateString('fr-FR')} — {r.objet || 'Réclamation'}
                </option>
              ))}
            </select>
          </div>

          {selectedRec && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.875rem', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                <span style={{ color: '#64748b' }}>Société</span>
                <strong>{societeLabel(selectedRec.panneId)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                <span style={{ color: '#64748b' }}>Équipement</span>
                <strong>{equipementLabel(selectedRec.panneId)}</strong>
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid #f1f5f9', margin: '1rem 0' }}></div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Type d'email</label>
              <select className="form-control" value={emailType} onChange={(e) => setEmailType(e.target.value)}>
                {emailTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ minWidth: '140px' }}>
              <label className="form-label">Urgence</label>
              <select className="form-control" value={urgence} onChange={(e) => setUrgence(e.target.value)}>
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
                <option value="CRITIQUE">Critique</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Objet de l'email</label>
            <input type="text" className="form-control" placeholder="Généré automatiquement..."
              value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', margin: '1rem 0' }}></div>

          <div className="flex gap-4">
            <div className="form-group w-full">
              <label className="form-label">Nom du signataire</label>
              <input type="text" className="form-control" placeholder="Votre nom complet"
                value={signataire} onChange={(e) => setSignataire(e.target.value)} />
            </div>
            <div className="form-group w-full">
              <label className="form-label">Fonction</label>
              <input type="text" className="form-control"
                value={fonction} onChange={(e) => setFonction(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Aperçu en temps réel
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#fafafa', minHeight: '120px' }}>
              <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.875rem' }}>
                Sélectionnez une réclamation et un type d'email pour générer l'aperçu…
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button className="btn btn-secondary" style={{ gap: '0.375rem' }} onClick={handleGenerate}>
            <CopyIcon size={14} />
            Copier
          </button>
          <button className="btn btn-primary" style={{ gap: '0.375rem' }} onClick={handleGenerate}>
            <SendIcon size={14} />
            Simuler l'envoi
          </button>
        </div>
      </div>
    </>
  );
}

export default EmailPanel;