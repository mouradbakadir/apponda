import { apiClient, LIST_LIMIT } from './apiClient.js';

export const reclamationsApi = {
  getAll: () => apiClient.get('/reclamations', { params: { limit: LIST_LIMIT } }).then(r => r.data),
  create: (data) => apiClient.post('/reclamations', data).then(r => r.data),
  update: (id, data) => apiClient.patch(`/reclamations/${id}`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/reclamations/${id}`),
  generateEmail: (id, payload) => apiClient.post(`/reclamations/${id}/generate-email`, payload).then(r => r.data),
  sendEmail: (id, payload) => apiClient.post(`/reclamations/${id}/send-email`, payload).then(r => r.data),
};