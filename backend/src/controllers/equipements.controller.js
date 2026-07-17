import * as equipementsService from '../services/equipements.service.js';

export async function getAllController(req, res, next) {
  try {
    res.json(await equipementsService.getAll(req.tenantFilter, req.query));
  } catch (err) { next(err); }
}

export async function getByIdController(req, res, next) {
  try {
    res.json(await equipementsService.getById(req.params.id, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function createController(req, res, next) {
  try {
    const equipement = await equipementsService.create(req.body, req.user);
    res.status(201).json(equipement);
  } catch (err) { next(err); }
}

export async function updateController(req, res, next) {
  try {
    res.json(await equipementsService.update(req.params.id, req.body, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function removeController(req, res, next) {
  try {
    await equipementsService.remove(req.params.id, req.tenantFilter);
    res.status(204).send();
  } catch (err) { next(err); }
}