import { TrashIcon } from './icons.jsx';

function ConfirmModal({ open, onCancel, onConfirm, title, message, confirmLabel = 'Supprimer' }) {
  if (!open) return null;
  return (
    <div className="modal-overlay active" style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <TrashIcon size={44} stroke="#dc2626" style={{ margin: '0 auto' }} />
        </div>
        <h3 style={{ marginBottom: '0.375rem', color: '#0f172a', fontSize: '1rem' }}>{title}</h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{message}</p>
        <div className="flex gap-2 justify-center">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;