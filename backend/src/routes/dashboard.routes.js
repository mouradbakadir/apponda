import { Router } from 'express';
import * as ctrl from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validateQuery } from '../middlewares/validateQuery.js';
import { dashboardQuerySchema } from '../validators/dashboard.validator.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/', validateQuery(dashboardQuerySchema), ctrl.getDashboardController);

export default router;