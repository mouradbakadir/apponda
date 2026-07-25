import { apiClient } from './apiClient.js';
export const kpiApi = {
  getSummary: (marcheId, dateDebut, dateFin) =>
    apiClient.get(`/kpi/marche/${marcheId}`, { params: { dateDebut, dateFin } }).then(r => r.data),
};