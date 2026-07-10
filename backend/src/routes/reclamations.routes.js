import { Router } from 'express';
import * as ctrl from '../controllers/reclamations.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { createReclamationSchema } from '../validators/reclamations.validator.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/', ctrl.getAllController);
router.post('/', authorize('SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'), validate(createReclamationSchema), ctrl.createController);

export default router;