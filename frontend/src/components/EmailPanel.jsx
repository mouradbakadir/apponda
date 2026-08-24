import { useState } from 'react';
import { MailIcon, CopyIcon, SendIcon } from './icons.jsx';
import { reclamationsApi } from '../services/reclamations.api.js';

const emailTypes = [
  { value: 'NOTIF_PANNE', label: "Demande d'intervention (Courte)" },
  { value: 'NOTIF_PANNE_DET', label: "Demande d'intervention (Formelle)" },
  { value: 'RELANCE_1', label: 'Première relance (Retard)' },
  { value: 'RELANCE_2', label: 'Deuxième relance (Mise en garde)' },
  { value: 'NON_CONFORMITE', label: 'Constat de non-conformité' },
  { value: 'PENALITES', label: 'Notification de pénalités' },
  { value: 'MISE_EN_DEMEURE', label: 'Mise en demeure' },
];

// Le message du backend est toujours le plus utile (« le service IA n'a pas
// pu... », « l'envoi n'est pas configuré... »). Sans réponse du tout, on dit
// explicitement que le serveur n'a pas répondu plutôt que d'afficher un échec
// générique qui laisse croire à une erreur de saisie.
function apiErrorMessage(err, fallback) {
  const backendMessage = err.response?.data?.error?.message;
  if (backendMessage) return backendMessage;
  if (err.response) return fallback;
  return `${fallback} Le serveur n'a pas répondu (${err.message}).`;
}

function EmailPanel({ open, onClose, reclamations, equipementLabel, societeLabel }) {
  const [selectedRecId, setSelectedRecId] = useState('');
  const [emailType, setEmailType] = useState('NOTIF_PANNE');
  const [urgence, setUrgence] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [corps, setCorps] = useState('');
  const [contexteLibre, setContexteLibre] = useState('');
  const [signataire, setSignataire] = useState('');
  const [fonction, setFonction] = useState('Chef de Division Maintenance');
  const [destinataire, setDestinataire] = useState('');

  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sentOk, setSentOk] = useState(false);

  if (!open) return null;

  const selectedRec = reclamations.find((r) => r.id === selectedRecId);

  async function handleGenerate() {
    if (!selectedRecId) {
      setError('Sélectionnez une réclamation avant de générer.');
      return;
    }
    setError('');
    setSentOk(false);
    setGenerating(true);
    try {
      const result = await reclamationsApi.generateEmail(selectedRecId, {
        type: emailType,
        urgence,
        signataire: signataire || null,
        fonction: fonction || null,
        contexteLibre: contexteLibre || null,
      });
      setSubject(result.objet);
      setCorps(result.corps);
      setDestinataire(result.destinataireSuggere || '');
    } catch (err) {
      setError(apiErrorMessage(err, "Échec de la génération de l'email."));
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(`Objet : ${subject}\n\n${corps}`);
  }

  async function handleSend() {
    if (!destinataire || !subject || !corps) {
      setError("Destinataire, objet et corps sont requis avant l'envoi.");
      return;
    }
    setError('');
    setSending(true);
    try {
      await reclamationsApi.sendEmail(selectedRecId, { destinataire, objet: subject, corps });
      setSentOk(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Échec de l'envoi de l'email."));
    } finally {
      setSending(false);
    }
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
            <select className="form-control" value={selectedRecId} onChange={(e) => { setSelectedRecId(e.target.value); setSubject(''); setCorps(''); setSentOk(false); }}>
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
            <label className="form-label">Contexte additionnel (optionnel)</label>
            <textarea className="form-control" rows={2} placeholder="Ex: l'équipement fait un bruit anormal depuis ce matin..."
              value={contexteLibre} onChange={(e) => setContexteLibre(e.target.value)} />
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

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Objet de l'email</label>
            <input type="text" className="form-control" placeholder="Généré automatiquement..."
              value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Corps de l'email</label>
            <textarea className="form-control" rows={10} placeholder="Cliquez sur « Générer » pour créer un brouillon, puis modifiez-le librement avant l'envoi..."
              value={corps} onChange={(e) => setCorps(e.target.value)} />
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '1.25rem' }} onClick={handleGenerate} disabled={generating}>
            {generating ? 'Génération en cours…' : '✨ Générer le brouillon (IA)'}
          </button>

          <div style={{ borderTop: '1px solid #f1f5f9', margin: '1rem 0' }}></div>

          <div className="form-group">
            <label className="form-label">Destinataire</label>
            <input type="email" className="form-control" placeholder="destinataire@societe.com"
              value={destinataire} onChange={(e) => setDestinataire(e.target.value)} />
          </div>

          {sentOk && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}>
              ✅ Email envoyé avec succès.
            </div>
          )}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ gap: '0.375rem' }} onClick={handleCopy} disabled={!corps}>
            <CopyIcon size={14} />
            Copier
          </button>
          <button className="btn btn-primary" style={{ gap: '0.375rem' }} onClick={handleSend} disabled={sending || !corps}>
            <SendIcon size={14} />
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
      </div>
    </>
  );
}

export default EmailPanel;