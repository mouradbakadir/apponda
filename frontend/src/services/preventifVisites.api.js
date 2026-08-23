import { apiClient, LIST_LIMIT } from './apiClient.js';

export const preventifVisitesApi = {
  getAll: () => apiClient.get('/preventif-visites', { params: { limit: LIST_LIMIT } }).then(r => r.data),
  create: (data) => apiClient.post('/preventif-visites', data).then(r => r.data),
  update: (id, data) => apiClient.patch(`/preventif-visites/${id}`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/preventif-visites/${id}`),
};