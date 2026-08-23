import { apiClient } from './apiClient.js';

export const marcheDocumentsApi = {
  getStatus: (id) => apiClient.get(`/marche-documents/${id}`).then((r) => r.data),

  attach: (id, marcheId) => apiClient.patch(`/marche-documents/${id}/attach`, { marcheId }).then((r) => r.data),

  getComparaison: (id) => apiClient.get(`/marche-documents/${id}/comparaison`).then((r) => r.data),

  confirmer: (id, champs) => apiClient.post(`/marche-documents/${id}/confirmer`, { champs }).then((r) => r.data),

  /**
   * Récupère le PDF et le réexpose sous forme d'URL blob locale.
   *
   * Le endpoint de téléchargement exige l'en-tête Authorization (ajouté par
   * l'intercepteur d'apiClient) : on ne peut donc pas pointer une <iframe>
   * directement sur l'URL de l'API, le navigateur n'y joindrait aucun token
   * et recevrait un 401. On télécharge donc le binaire via axios, puis on le
   * redonne au navigateur sous une forme qu'il sait afficher.
   *
   * Le type est forcé à application/pdf : le serveur renvoie un
   * Content-Disposition "attachment", qui ferait télécharger le fichier au
   * lieu de l'afficher. Ici c'est nous qui décidons du type du blob.
   *
   * L'appelant DOIT libérer l'URL avec URL.revokeObjectURL() une fois qu'il
   * a fini, sinon le blob reste en mémoire jusqu'au rechargement de la page.
   */
  fetchBlobUrl: async (id) => {
    const response = await apiClient.get(`/marche-documents/${id}/download`, { responseType: 'blob' });
    return window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  },

  download: async (id, filename) => {
    const url = await marcheDocumentsApi.fetchBlobUrl(id);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * @param {File} file
   * @param {{ marcheId?: string, airportId?: string, selectedPages?: number[],
   *           autoExtract?: boolean, onProgress?: (percent: number) => void }} options
   *
   * `onProgress` reçoit la progression réelle du transfert (0 à 100). Sur les
   * gros PDF scannés, l'envoi peut durer plusieurs dizaines de secondes :
   * sans ce retour, l'utilisateur n'a aucun moyen de savoir où en est
   * l'upload. Le total n'est pas toujours connu du navigateur (réponse
   * compressée, requête relayée) -- dans ce cas on n'appelle pas le callback
   * plutôt que d'afficher un pourcentage faux.
   */
  upload: (file, { marcheId, airportId, selectedPages, autoExtract, onProgress } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (marcheId) formData.append('marcheId', marcheId);
    if (airportId) formData.append('airportId', airportId);
    if (selectedPages) formData.append('selectedPages', JSON.stringify(selectedPages));
    if (autoExtract === false) formData.append('autoExtract', 'false');

    return apiClient
      .post('/marche-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (event) => {
              if (!event.total) return;
              onProgress(Math.round((event.loaded * 100) / event.total));
            }
          : undefined,
      })
      .then((r) => r.data);
  },

  triggerExtraction: (id) => apiClient.post(`/marche-documents/${id}/extract`).then((r) => r.data),
};
