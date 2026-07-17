import * as societesService from '../services/societes.service.js';

export async function getAllController(req, res, next) {
  try {
    res.json(await societesService.getAll(req.tenantFilter, req.query));
  } catch (err) { next(err); }
}

export async function getByIdController(req, res, next) {
  try {
    res.json(await societesService.getById(req.params.id, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function createController(req, res, next) {
  try {
    const societe = await societesService.create(req.body, req.user);
    res.status(201).json(societe);
  } catch (err) { next(err); }
}

export async function updateController(req, res, next) {
  try {
    res.json(await societesService.update(req.params.id, req.body, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function removeController(req, res, next) {
  try {
    await societesService.remove(req.params.id, req.tenantFilter);
    res.status(204).send();
  } catch (err) { next(err); }
}