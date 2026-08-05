import { apiClient } from './apiClient.js';

export const marcheDocumentsApi = {
  /**
   * @param {File} file
   * @param {{ marcheId?: string, airportId?: string, selectedPages?: number[] }} options
   */
  upload: (file, { marcheId, airportId, selectedPages } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (marcheId) formData.append('marcheId', marcheId);
    if (airportId) formData.append('airportId', airportId);
    if (selectedPages) formData.append('selectedPages', JSON.stringify(selectedPages));

    return apiClient
      .post('/marche-documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },

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
  upload: (file, { marcheId, airportId, selectedPages, autoExtract } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (marcheId) formData.append('marcheId', marcheId);
    if (airportId) formData.append('airportId', airportId);
    if (selectedPages) formData.append('selectedPages', JSON.stringify(selectedPages));
    if (autoExtract === false) formData.append('autoExtract', 'false');

    return apiClient
      .post('/marche-documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },

  triggerExtraction: (id) => apiClient.post(`/marche-documents/${id}/extract`).then((r) => r.data),
};