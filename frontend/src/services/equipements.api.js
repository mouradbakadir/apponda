import { apiClient } from './apiClient.js';

export const equipementsApi = {
  getAll: () => apiClient.get('/equipements').then(r => r.data.data || r.data),
  create: (data) => apiClient.post('/equipements', data).then(r => r.data),
  update: (id, data) => apiClient.patch(`/equipements/${id}`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/equipements/${id}`),
};