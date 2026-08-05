import { apiClient } from './apiClient.js';

export const sloApi = {
  getConfig: (societeId) => apiClient.get(`/slo/config/${societeId}`).then((r) => r.data),
  saveConfig: (data) => apiClient.post('/slo/config', data).then((r) => r.data),
  getAnalysis: (params) => apiClient.get('/slo/analysis', { params }).then((r) => r.data),
};