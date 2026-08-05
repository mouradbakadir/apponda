import * as sloService from '../services/slo.service.js';

export async function getConfigController(req, res, next) {
  try {
    res.json(await sloService.getConfig(req.params.societeId, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function saveConfigController(req, res, next) {
  try {
    res.json(await sloService.saveConfig(req.body, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function getAnalysisController(req, res, next) {
  try {
    const { marcheId, societeId, period, year } = req.validatedQuery;
    res.json(await sloService.computeAnalysis(marcheId, societeId, period, year, req.tenantFilter));
  } catch (err) { next(err); }
}