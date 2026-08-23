// src/services/preventif.api.js
import { apiClient, LIST_LIMIT } from './apiClient.js';
export const preventifApi = {
  getAll: () => apiClient.get('/preventif', { params: { limit: LIST_LIMIT } }).then(r => r.data.data || r.data),
  create: (data) => apiClient.post('/preventif', data).then(r => r.data),
  validate: (id, valide) => apiClient.patch(`/preventif/${id}/validate`, { valide }).then(r => r.data),
};