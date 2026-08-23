import { apiClient, LIST_LIMIT } from './apiClient.js';

export const societesApi = {
  getAll: () => apiClient.get('/societes', { params: { limit: LIST_LIMIT } }).then(r => r.data.data || r.data),
  create: (data) => apiClient.post('/societes', data).then(r => r.data),
  update: (id, data) => apiClient.patch(`/societes/${id}`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/societes/${id}`),
};