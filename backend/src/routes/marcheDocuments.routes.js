import { Router } from 'express';
import * as ctrl from '../controllers/marcheDocuments.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validate } from '../middlewares/validate.js';
import { uploadDocumentSchema, confirmDocumentSchema } from '../validators/marcheDocuments.validator.js';
import { uploadPdf } from '../middlewares/upload.js';
import { auditLog } from '../middlewares/auditLog.js';

const router = Router();
router.use(authenticate, tenantScope);

// IMPORTANT sur l'ordre des middlewares : `uploadPdf.single('file')` doit
// s'exécuter AVANT `validate(...)`, car c'est multer qui remplit req.body
// pour une requête multipart/form-data -- express.json() (utilisé par
// défaut dans app.js) ne sait pas parser ce type de contenu. Si l'ordre
// était inversé, `validate` verrait un req.body vide et rejetterait
// systématiquement la requête.
router.post(
  '/',
  authorize('SUPER_ADMIN', 'SUPERVISEUR'),
  uploadPdf.single('file'),
  validate(uploadDocumentSchema),
  ctrl.uploadController
);

router.get('/:id', ctrl.getStatusController);
router.get('/:id/download', ctrl.downloadController);
router.post('/:id/extract', authorize('SUPER_ADMIN', 'SUPERVISEUR'), ctrl.triggerExtractionController);

router.patch(
  '/:id/attach',
  authorize('SUPER_ADMIN', 'SUPERVISEUR'),
  auditLog('marche_documents'),
  ctrl.attachController
);

router.get('/:id/comparaison', ctrl.compareController);

router.post(
  '/:id/confirmer',
  authorize('SUPER_ADMIN', 'SUPERVISEUR'),
  validate(confirmDocumentSchema),
  auditLog('marches'), // la confirmation modifie le Marche, pas le document -- même table auditée que marches.routes.js
  ctrl.confirmController
);

export default router;