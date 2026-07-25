import { Router } from 'express';
import * as ctrl from '../controllers/airports.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.getAllController);

export default router;