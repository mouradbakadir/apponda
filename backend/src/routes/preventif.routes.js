import { Router } from 'express';
import * as ctrl from '../controllers/preventif.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { createPreventifSchema } from '../validators/preventif.validator.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/', ctrl.getAllController);
router.post('/', authorize('SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'), validate(createPreventifSchema), ctrl.createController);
router.patch('/:id/validate', authorize('SUPER_ADMIN', 'SUPERVISEUR'), ctrl.validateController);

export default router;