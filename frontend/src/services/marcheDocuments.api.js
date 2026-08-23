import { apiClient } from './apiClient.js';

export const marcheDocumentsApi = {
  getStatus: (id) => apiClient.get(`/marche-documents/${id}`).then((r) => r.data),

  attach: (id, marcheId) => apiClient.patch(`/marche-documents/${id}/attach`, { marcheId }).then((r) => r.data),

  getComparaison: (id) => apiClient.get(`/marche-documents/${id}/comparaison`).then((r) => r.data),

  confirmer: (id, champs) => apiClient.post(`/marche-documents/${id}/confirmer`, { champs }).then((r) => r.data),

  download: async (id, filename) => {
    const response = await apiClient.get(`/marche-documents/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
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
