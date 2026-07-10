import * as kpiService from '../services/kpi.service.js';

export async function getKpiByMarcheController(req, res, next) {
  try {
    const { dateDebut, dateFin } = req.validatedQuery;
    const result = await kpiService.getKpiSummary(req.params.marcheId, dateDebut, dateFin, req.tenantFilter);
    res.json(result);
  } catch (err) { next(err); }
}