import * as reclamationsService from '../services/reclamations.service.js';

export async function getAllController(req, res, next) {
  try {
    res.json(await reclamationsService.getAll(req.tenantFilter));
  } catch (err) { next(err); }
}

export async function createController(req, res, next) {
  try {
    const reclamation = await reclamationsService.create(req.body, req.user);
    res.status(201).json(reclamation);
  } catch (err) { next(err); }
}