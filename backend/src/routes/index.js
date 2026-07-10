import { Router } from 'express';
import authRoutes from './auth.routes.js';
import marchesRoutes from './marches.routes.js';
import societesRoutes from './societes.routes.js';
import equipementsRoutes from './equipements.routes.js';
import preventifRoutes from './preventif.routes.js';
import pannesRoutes from './pannes.routes.js';
import reclamationsRoutes from './reclamations.routes.js';
import kpiRoutes from './kpi.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/marches', marchesRoutes);
router.use('/societes', societesRoutes);
router.use('/equipements', equipementsRoutes);
router.use('/preventif', preventifRoutes);
router.use('/pannes', pannesRoutes);
router.use('/reclamations', reclamationsRoutes);
router.use('/kpi', kpiRoutes);

export default router;