import { useState, useEffect } from 'react';
import { marcheDocumentsApi } from '../services/marcheDocuments.api.js';

/**
 * Lecteur de PDF intégré au site : permet de consulter le document d'un
 * marché sans avoir à le télécharger puis à l'ouvrir dans un autre logiciel.
 *
 * Le rendu est confié au lecteur PDF natif du navigateur via une <iframe>.
 * C'est volontaire : il apporte déjà le zoom, la recherche plein texte, la
 * pagination et l'impression, là où une bibliothèque de rendu ajouterait
 * plusieurs centaines de kilo-octets au bundle pour refaire la même chose.
 *
 * Le composant est monté à l'ouverture et démonté à la fermeture (voir son
 * usage dans MarchesPage) : chaque consultation repart donc d'un état neuf,
 * sans avoir à le réinitialiser à la main.
 */
function PdfViewerModal({ documentId, filename, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // `annule` protège le cas où l'utilisateur ferme la fenêtre pendant le
    // téléchargement : sans lui, la réponse tardive tenterait de peupler un
    // composant démonté, et l'URL blob créée ne serait jamais libérée.
    let annule = false;
    let urlCree = null;

    marcheDocumentsApi
      .fetchBlobUrl(documentId)
      .then((url) => {
        if (annule) {
          window.URL.revokeObjectURL(url);
          return;
        }
        urlCree = url;
        setBlobUrl(url);
      })
      .catch(() => {
        if (annule) return;
        // Message générique volontaire : la requête étant en responseType
        // 'blob', un corps d'erreur JSON renvoyé par l'API arriverait ici
        // sous forme de Blob, illisible sans le relire de façon asynchrone.
        setError("Impossible d'ouvrir ce document. Il a peut-être été supprimé du serveur.");
      });

    return () => {
      annule = true;
      if (urlCree) window.URL.revokeObjectURL(urlCree);
    };
  }, [documentId]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* La fenêtre stoppe la propagation : un clic à l'intérieur (sur la
          barre d'outils du lecteur par exemple) ne doit pas la refermer. */}
      <div
        className="bg-white rounded-xl shadow-lg flex flex-col overflow-hidden"
        style={{ width: '95vw', maxWidth: '1100px', height: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-200">
          <div style={{ minWidth: 0 }}>
            <h2 className="text-sm font-semibold text-slate-800 truncate" title={filename}>
              {filename || 'Document du marché'}
            </h2>
          </div>

          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
              onClick={() => marcheDocumentsApi.download(documentId, filename)}
            >
              Télécharger
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              title="Fermer"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1" style={{ background: '#f1f5f9', minHeight: 0 }}>
          {error && (
            <div className="h-full flex items-center justify-center p-6">
              <p style={{ color: '#dc2626', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>
            </div>
          )}

          {!error && !blobUrl && (
            <div className="h-full flex items-center justify-center p-6">
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>Chargement du document...</p>
            </div>
          )}

          {!error && blobUrl && (
            <iframe
              src={blobUrl}
              title={filename || 'Document du marché'}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          )}
        </div>

        {/* Filet de sécurité : plusieurs navigateurs mobiles refusent
            d'afficher un PDF dans une iframe et laissent une zone vide. */}
        {!error && blobUrl && (
          <div className="px-5 py-2 border-t border-slate-200" style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Le document ne s'affiche pas ?{' '}
            <a href={blobUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand, #4f46e5)', fontWeight: 600 }}>
              Ouvrir dans un nouvel onglet
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfViewerModal;
