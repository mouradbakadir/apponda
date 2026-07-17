import { Router } from 'express';
import * as ctrl from '../controllers/kpi.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { tenantScope } from '../middlewares/tenantScope.js';
import { validateQuery } from '../middlewares/validateQuery.js';
import { kpiQuerySchema } from '../validators/kpi.validator.js';
import { cache } from '../middlewares/cache.js';
import { reportsQueue } from '../config/queue.js';

const router = Router();
router.use(authenticate, tenantScope);

router.get('/marche/:marcheId', validateQuery(kpiQuerySchema), cache(300), ctrl.getKpiByMarcheController);
router.post('/marche/:marcheId/generate-pdf', async (req, res, next) => {
    try {
      // On ajoute un nouveau Job dans la file d'attente
      const job = await reportsQueue.add('generate-kpi-pdf', {
        marcheId: req.params.marcheId,
        userId: req.user.id,
        email: req.user.email
      });
  
      // L'API répond IMMÉDIATEMENT, sans attendre les 5 secondes !
      res.status(202).json({
        message: "La génération du PDF a commencé en arrière-plan.",
        jobId: job.id
      });
    } catch (err) { next(err); }
  });
  
export default router;