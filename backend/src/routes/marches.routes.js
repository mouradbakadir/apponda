import { Router } from 'express';
import * as ctrl from '../controllers/marches.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { createMarcheSchema, updateMarcheSchema } from '../validators/marches.validator.js';

const router = Router();

router.use(authenticate, tenantScope); // s'applique à TOUTES les routes ci-dessous

router.get('/', ctrl.getAllController);
router.get('/:id', ctrl.getByIdController);
router.post('/', authorize('SUPER_ADMIN', 'SUPERVISEUR'), validate(createMarcheSchema), ctrl.createController);
router.patch('/:id', authorize('SUPER_ADMIN', 'SUPERVISEUR'), validate(updateMarcheSchema), ctrl.updateController);
router.delete('/:id', authorize('SUPER_ADMIN'), ctrl.removeController);

export default router;