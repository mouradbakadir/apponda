import { apiClient } from './apiClient.js';

export const preventifVisitesApi = {
  getAll: () => apiClient.get('/preventif-visites').then(r => r.data),
  create: (data) => apiClient.post('/preventif-visites', data).then(r => r.data),
  update: (id, data) => apiClient.patch(`/preventif-visites/${id}`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/preventif-visites/${id}`),
};