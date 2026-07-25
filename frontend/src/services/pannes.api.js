import { apiClient } from './apiClient.js';

export const pannesApi = {
  getAll: () => apiClient.get('/pannes').then(r => r.data),
  create: (data) => apiClient.post('/pannes', data).then(r => r.data),
  close: (id, data) => apiClient.patch(`/pannes/${id}/close`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/pannes/${id}`),
};