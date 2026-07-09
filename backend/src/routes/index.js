import { Router } from 'express';
import authRoutes from './auth.routes.js';
import marchesRoutes from './marches.routes.js';


const router = Router();
router.use('/auth', authRoutes);
router.use('/marches', marchesRoutes);

export default router;