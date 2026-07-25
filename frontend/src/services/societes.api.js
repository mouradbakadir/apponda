import { apiClient } from './apiClient.js';

export const societesApi = {
  getAll: () => apiClient.get('/societes').then(r => r.data.data || r.data),
  create: (data) => apiClient.post('/societes', data).then(r => r.data),
  update: (id, data) => apiClient.patch(`/societes/${id}`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/societes/${id}`),
};