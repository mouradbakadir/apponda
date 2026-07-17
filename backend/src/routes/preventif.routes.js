import { Router } from 'express';
import * as ctrl from '../controllers/preventif.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { createPreventifSchema } from '../validators/preventif.validator.js';
import { auditLog } from '../middlewares/auditLog.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/', ctrl.getAllController);
router.get('/:id', ctrl.getByIdController);
router.post('/', authorize('SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'), validate(createPreventifSchema), auditLog('interventions_preventives'), ctrl.createController);
router.patch('/:id/validate', authorize('SUPER_ADMIN', 'SUPERVISEUR'), auditLog('interventions_preventives'), ctrl.validateController);
router.delete('/:id', authorize('SUPER_ADMIN', 'SUPERVISEUR'), auditLog('interventions_preventives'), ctrl.removeController);

export default router;