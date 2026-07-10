import * as pannesService from '../services/pannes.service.js';

export async function getAllController(req, res, next) {
  try {
    res.json(await pannesService.getAll(req.tenantFilter));
  } catch (err) { next(err); }
}

export async function createController(req, res, next) {
  try {
    const panne = await pannesService.create(req.body, req.user);
    res.status(201).json(panne);
  } catch (err) { next(err); }
}

export async function closeController(req, res, next) {
  try {
    const panne = await pannesService.close(req.params.id, req.body, req.tenantFilter);
    res.json(panne);
  } catch (err) { next(err); }
}