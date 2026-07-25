import * as service from '../services/preventifVisites.service.js';

export async function getAllController(req, res, next) {
  try { res.json(await service.getAll(req.tenantFilter, req.query)); } catch (err) { next(err); }
}

export async function getByIdController(req, res, next) {
  try { res.json(await service.getById(req.params.id, req.tenantFilter)); } catch (err) { next(err); }
}

export async function createController(req, res, next) {
  try { res.status(201).json(await service.create(req.body, req.user)); } catch (err) { next(err); }
}

export async function updateController(req, res, next) {
  try { res.json(await service.update(req.params.id, req.body, req.tenantFilter)); } catch (err) { next(err); }
}

export async function removeController(req, res, next) {
  try {
    await service.remove(req.params.id, req.tenantFilter);
    res.status(204).send();
  } catch (err) { next(err); }
}