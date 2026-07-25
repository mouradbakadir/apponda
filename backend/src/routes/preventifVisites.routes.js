import { Router } from 'express';
import * as ctrl from '../controllers/preventifVisites.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { createVisiteSchema, updateVisiteSchema } from '../validators/preventifVisites.validator.js';
import { auditLog } from '../middlewares/auditLog.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/', ctrl.getAllController);
router.get('/:id', ctrl.getByIdController);
router.post('/', authorize('SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'), validate(createVisiteSchema), auditLog('preventif_visites'), ctrl.createController);
router.patch('/:id', authorize('SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'), validate(updateVisiteSchema), auditLog('preventif_visites'), ctrl.updateController);
router.delete('/:id', authorize('SUPER_ADMIN', 'SUPERVISEUR'), auditLog('preventif_visites'), ctrl.removeController);

export default router;