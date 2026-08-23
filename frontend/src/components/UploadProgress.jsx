/**
 * Barre de progression du transfert d'un fichier vers le serveur.
 *
 * À 100 % le fichier est entièrement parti du navigateur, mais le serveur
 * n'a pas encore répondu (écriture sur disque, validation) : le libellé
 * change alors, pour ne pas laisser croire que l'opération est terminée
 * alors qu'il reste une attente.
 */
function UploadProgress({ percent, label = 'Envoi du fichier' }) {
  const termine = percent >= 100;
  return (
    <div className="upload-progress">
      <div className="upload-progress-track">
        <div className="upload-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="upload-progress-label">
        <span>{termine ? 'Envoi terminé — traitement par le serveur...' : `${label} en cours...`}</span>
        <span className="upload-progress-percent">{percent} %</span>
      </div>
    </div>
  );
}

export default UploadProgress;
