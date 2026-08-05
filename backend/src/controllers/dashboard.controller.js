import * as dashboardService from '../services/dashboard.service.js';

export async function getDashboardController(req, res, next) {
  try {
    const { period, societeId, year } = req.validatedQuery;
    res.json(await dashboardService.getDashboardSummary(req.tenantFilter, { period, societeId, year }));
  } catch (err) { next(err); }
}