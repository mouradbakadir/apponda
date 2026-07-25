import { apiClient } from './apiClient.js';

export const marchesApi = {
  getAll: () => apiClient.get('/marches').then(r => r.data.data || r.data),
  create: (data) => apiClient.post('/marches', data).then(r => r.data),
  update: (id, data) => apiClient.patch(`/marches/${id}`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/marches/${id}`),
};