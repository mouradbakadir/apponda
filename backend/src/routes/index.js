import { Router } from 'express';
import authRoutes from './auth.routes.js';
import marchesRoutes from './marches.routes.js';
import societesRoutes from './societes.routes.js';
import equipementsRoutes from './equipements.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/marches', marchesRoutes);
router.use('/societes', societesRoutes);
router.use('/equipements', equipementsRoutes);

export default router;