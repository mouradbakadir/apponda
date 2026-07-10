import { Router } from 'express';
import * as ctrl from '../controllers/pannes.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { createPanneSchema, closePanneSchema } from '../validators/pannes.validator.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/', ctrl.getAllController);
router.post('/', authorize('SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'), validate(createPanneSchema), ctrl.createController);
router.patch('/:id/close', authorize('SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'), validate(closePanneSchema), ctrl.closeController);

export default router;