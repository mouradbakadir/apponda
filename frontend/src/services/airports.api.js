import { apiClient } from './apiClient.js';

export const airportsApi = {
  getAll: () => apiClient.get('/airports').then(r => r.data),
};