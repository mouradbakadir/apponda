// src/services/preventif.api.js
import { apiClient } from './apiClient.js';
export const preventifApi = {
  getAll: () => apiClient.get('/preventif').then(r => r.data.data || r.data),
  create: (data) => apiClient.post('/preventif', data).then(r => r.data),
  validate: (id, valide) => apiClient.patch(`/preventif/${id}/validate`, { valide }).then(r => r.data),
};