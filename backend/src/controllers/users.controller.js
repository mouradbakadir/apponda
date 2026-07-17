import * as usersService from '../services/users.service.js';

export async function getAllController(req, res, next) {
    try {
      const tenantFilter = req.user.role === 'SUPER_ADMIN' ? {} : { airportId: req.user.airportId };
      res.json(await usersService.getAll(tenantFilter, req.query));
    } catch (err) { next(err); }
  }

export async function getByIdController(req, res, next) {
  try {
    const tenantFilter = req.user.role === 'SUPER_ADMIN' ? {} : { airportId: req.user.airportId };
    const user = await usersService.getById(req.params.id, tenantFilter);
    res.json(user);
  } catch (err) { next(err); }
}

export async function createController(req, res, next) {
  try {
    const user = await usersService.create(req.body);
    res.status(201).json(user);
  } catch (err) { next(err); }
}

export async function updateController(req, res, next) {
  try {
    const tenantFilter = req.user.role === 'SUPER_ADMIN' ? {} : { airportId: req.user.airportId };
    const user = await usersService.update(req.params.id, req.body, tenantFilter);
    res.json(user);
  } catch (err) { next(err); }
}

export async function removeController(req, res, next) {
  try {
    const tenantFilter = req.user.role === 'SUPER_ADMIN' ? {} : { airportId: req.user.airportId };
    await usersService.remove(req.params.id, tenantFilter);
    res.status(204).send(); // 204 No Content
  } catch (err) { next(err); }
}