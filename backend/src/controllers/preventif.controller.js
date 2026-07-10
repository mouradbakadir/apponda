import * as service from '../services/preventif.service.js';

export async function getAllController(req, res, next) {
  try { res.json(await service.getAll(req.tenantFilter)); } catch (err) { next(err); }
}

export async function createController(req, res, next) {
  try { res.status(201).json(await service.create(req.body, req.user)); } catch (err) { next(err); }
}

export async function validateController(req, res, next) {
  try {
    res.json(await service.validate(req.params.id, req.body.valide, req.user.id, req.tenantFilter));
  } catch (err) { next(err); }
}