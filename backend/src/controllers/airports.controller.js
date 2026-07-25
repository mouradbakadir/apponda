import * as airportsService from '../services/airports.service.js';

export async function getAllController(req, res, next) {
  try {
    res.json(await airportsService.getAll(req.user));
  } catch (err) { next(err); }
}