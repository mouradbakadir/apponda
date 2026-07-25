import { apiClient } from './apiClient.js';

export const reclamationsApi = {
  getAll: () => apiClient.get('/reclamations').then(r => r.data),
  create: (data) => apiClient.post('/reclamations', data).then(r => r.data),
  update: (id, data) => apiClient.patch(`/reclamations/${id}`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/reclamations/${id}`),
};