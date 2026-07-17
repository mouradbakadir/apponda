import * as pannesService from '../services/pannes.service.js';

export async function getAllController(req, res, next) {
  try {
    res.json(await pannesService.getAll(req.tenantFilter, req.query));
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

export async function getByIdController(req, res, next) {
  try {
    res.json(await pannesService.getById(req.params.id, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function removeController(req, res, next) {
  try {
    await pannesService.remove(req.params.id, req.tenantFilter);
    res.status(204).send();
  } catch (err) { next(err); }
}