import * as reclamationsService from '../services/reclamations.service.js';

export async function getAllController(req, res, next) {
  try {
    res.json(await reclamationsService.getAll(req.tenantFilter, req.query));
  } catch (err) { next(err); }
}

export async function createController(req, res, next) {
  try {
    const reclamation = await reclamationsService.create(req.body, req.user);
    res.status(201).json(reclamation);
  } catch (err) { next(err); }
}

export async function getByIdController(req, res, next) {
  try {
    res.json(await reclamationsService.getById(req.params.id, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function removeController(req, res, next) {
  try {
    await reclamationsService.remove(req.params.id, req.tenantFilter);
    res.status(204).send();
  } catch (err) { next(err); }
}