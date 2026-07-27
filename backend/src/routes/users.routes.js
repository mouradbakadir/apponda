import { Router } from 'express';
import * as ctrl from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/users.validator.js';
import { auditLog } from '../middlewares/auditLog.js';

const router = Router();

// CRITIQUE : Seul un SUPER_ADMIN authentifié peut acceder a ces routes
router.use(authenticate, authorize('SUPER_ADMIN'), tenantScope);

router.get('/', ctrl.getAllController);
router.get('/:id', ctrl.getByIdController);
router.post('/', validate(createUserSchema), auditLog('users'), ctrl.createController);
router.patch('/:id', validate(updateUserSchema), auditLog('users'), ctrl.updateController);
router.delete('/:id', auditLog('users'), ctrl.removeController);

export default router;