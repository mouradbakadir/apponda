import { Router } from 'express';
import * as ctrl from '../controllers/kpi.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validateQuery } from '../middlewares/validateQuery.js';
import { kpiQuerySchema } from '../validators/kpi.validator.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/marche/:marcheId', validateQuery(kpiQuerySchema), ctrl.getKpiByMarcheController);

export default router;