import { Router } from 'express';
import * as ctrl from '../controllers/equipements.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { createEquipementSchema, updateEquipementSchema } from '../validators/equipements.validator.js';
import { auditLog } from '../middlewares/auditLog.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/', ctrl.getAllController);
router.get('/:id', ctrl.getByIdController);
router.post('/', authorize('SUPER_ADMIN', 'SUPERVISEUR'), validate(createEquipementSchema), auditLog('equipements'), ctrl.createController);
router.patch('/:id', authorize('SUPER_ADMIN', 'SUPERVISEUR'), validate(updateEquipementSchema), auditLog('equipements'), ctrl.updateController);
router.delete('/:id', authorize('SUPER_ADMIN'), auditLog('equipements'), ctrl.removeController);

export default router;