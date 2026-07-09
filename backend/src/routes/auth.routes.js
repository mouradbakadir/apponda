import { Router } from 'express';
import { loginController, refreshController, logoutController, meController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.post('/login', validate(loginSchema), loginController);
router.post('/refresh', refreshController);
router.post('/logout', authenticate, logoutController);
router.get('/me', authenticate, meController);

export default router;