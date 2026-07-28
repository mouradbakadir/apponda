import { Router } from 'express';
import * as ctrl from '../controllers/reclamations.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { createReclamationSchema, updateReclamationSchema } from '../validators/reclamations.validator.js';
import { generateEmailSchema, sendEmailSchema } from '../validators/email.validator.js';
import { auditLog } from '../middlewares/auditLog.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/', ctrl.getAllController);
router.get('/:id', ctrl.getByIdController);
router.post('/', authorize('SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'), validate(createReclamationSchema), auditLog('reclamations'), ctrl.createController);
router.patch('/:id', authorize('SUPER_ADMIN', 'SUPERVISEUR', 'TECHNICIEN'), validate(updateReclamationSchema), auditLog('reclamations'), ctrl.updateController);
router.delete('/:id', authorize('SUPER_ADMIN', 'SUPERVISEUR'), auditLog('reclamations'), ctrl.removeController);

router.post('/:id/generate-email', authorize('SUPER_ADMIN', 'SUPERVISEUR'), validate(generateEmailSchema), ctrl.generateEmailController);
router.post('/:id/send-email', authorize('SUPER_ADMIN', 'SUPERVISEUR'), validate(sendEmailSchema), auditLog('reclamations'), ctrl.sendEmailController);

export default router;