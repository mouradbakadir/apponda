import * as usersService from '../services/users.service.js';

export async function getAllController(req, res, next) {
  try {
    res.json(await usersService.getAll(req.tenantFilter, req.query));
  } catch (err) { next(err); }
}

export async function getByIdController(req, res, next) {
  try {
    res.json(await usersService.getById(req.params.id, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function createController(req, res, next) {
  try {
    const user = await usersService.create(req.body, req.tenantFilter);
    res.status(201).json(user);
  } catch (err) { next(err); }
}

export async function updateController(req, res, next) {
  try {
    res.json(await usersService.update(req.params.id, req.body, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function removeController(req, res, next) {
  try {
    await usersService.remove(req.params.id, req.tenantFilter);
    res.status(204).send();
  } catch (err) { next(err); }
}