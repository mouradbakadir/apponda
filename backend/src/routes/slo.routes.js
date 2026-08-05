import { Router } from 'express';
import * as ctrl from '../controllers/slo.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { validateQuery } from '../middlewares/validateQuery.js';
import { sloConfigSchema, sloAnalysisQuerySchema } from '../validators/slo.validator.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/config/:societeId', ctrl.getConfigController);
router.post('/config', validate(sloConfigSchema), ctrl.saveConfigController);
router.get('/analysis', validateQuery(sloAnalysisQuerySchema), ctrl.getAnalysisController);

export default router;