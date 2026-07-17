import * as marchesService from '../services/marches.service.js';

export async function getAllController(req, res, next) {
  try {
    // On passe req.tenantFilter ET req.query au service
    res.json(await marchesService.getAll(req.tenantFilter, req.query));
  } catch (err) { next(err); }
}

export async function getByIdController(req, res, next) {
  try {
    res.json(await marchesService.getById(req.params.id, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function createController(req, res, next) {
  try {
    const marche = await marchesService.create(req.body, req.user);
    res.status(201).json(marche);
  } catch (err) { next(err); }
}

export async function updateController(req, res, next) {
  try {
    res.json(await marchesService.update(req.params.id, req.body, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function removeController(req, res, next) {
  try {
    await marchesService.remove(req.params.id, req.tenantFilter);
    res.status(204).send();
  } catch (err) { next(err); }
}
