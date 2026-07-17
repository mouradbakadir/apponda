import { Router } from 'express';
import * as ctrl from '../controllers/societes.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { createSocieteSchema, updateSocieteSchema } from '../validators/societes.validator.js';
import { auditLog } from '../middlewares/auditLog.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/', ctrl.getAllController);
router.get('/:id', ctrl.getByIdController);
router.post('/', authorize('SUPER_ADMIN', 'SUPERVISEUR'), validate(createSocieteSchema), auditLog('societes'), ctrl.createController);
router.patch('/:id', authorize('SUPER_ADMIN', 'SUPERVISEUR'), validate(updateSocieteSchema), auditLog('societes'), ctrl.updateController);
router.delete('/:id', authorize('SUPER_ADMIN'), auditLog('societes'), ctrl.removeController);

export default router;