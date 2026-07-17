import { Router } from 'express';
import { loginController, refreshController, logoutController, meController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, refreshSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middlewares/authenticate.js';
import { loginLimiter, refreshLimiter } from '../middlewares/rateLimiter.js';

const router = Router();
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Se connecter à l'application
 *     tags: [Auth]
 *     security: [] 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@onda.ma
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Connexion réussie
 */
router.post('/login', loginLimiter, validate(loginSchema), loginController);
router.post('/refresh', refreshLimiter, validate(refreshSchema), refreshController);
router.post('/logout', authenticate, logoutController);
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtenir le profil de l'utilisateur connecté
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Profil récupéré
 *       401:
 *         description: Non autorisé
 */
router.get('/me', authenticate, meController);

export default router;