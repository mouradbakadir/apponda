import * as authService from '../services/auth.service.js';

export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function refreshController(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function logoutController(req, res, next) {
  try {
    await authService.logout(req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function meController(req, res) {
  res.json({ user: req.user });
}