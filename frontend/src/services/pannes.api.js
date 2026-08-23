import { apiClient, LIST_LIMIT } from './apiClient.js';

export const pannesApi = {
  getAll: () => apiClient.get('/pannes', { params: { limit: LIST_LIMIT } }).then(r => r.data),
  create: (data) => apiClient.post('/pannes', data).then(r => r.data),
  close: (id, data) => apiClient.patch(`/pannes/${id}/close`, data).then(r => r.data),
  remove: (id) => apiClient.delete(`/pannes/${id}`),
};