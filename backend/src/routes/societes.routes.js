import { Router } from 'express';
import * as ctrl from '../controllers/societes.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { createSocieteSchema, updateSocieteSchema } from '../validators/societes.validator.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/', ctrl.getAllController);
router.get('/:id', ctrl.getByIdController);
router.post('/', authorize('SUPER_ADMIN', 'SUPERVISEUR'), validate(createSocieteSchema), ctrl.createController);
router.patch('/:id', authorize('SUPER_ADMIN', 'SUPERVISEUR'), validate(updateSocieteSchema), ctrl.updateController);
router.delete('/:id', authorize('SUPER_ADMIN'), ctrl.removeController);

export default router;