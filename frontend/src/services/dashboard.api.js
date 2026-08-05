import { apiClient } from './apiClient.js';

export const dashboardApi = {
  getSummary: (params) => apiClient.get('/dashboard', { params }).then((r) => r.data),
};