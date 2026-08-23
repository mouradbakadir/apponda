import * as marcheDocumentsService from '../services/marcheDocuments.service.js';
import { AppError } from '../utils/AppError.js';

export async function uploadController(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError(400, 'Aucun fichier reçu (champ attendu : "file")', 'MISSING_FILE');
    }

    // multipart/form-data : req.body arrive déjà validé/parsé par
    // uploadDocumentSchema pour marcheId/airportId (strings), mais
    // selectedPages, s'il est fourni, arrive en JSON stringifié (le
    // frontend l'envoie via FormData, qui ne supporte que des chaînes).
    let selectedPages;
    if (req.body.selectedPages) {
      try {
        selectedPages = JSON.parse(req.body.selectedPages);
      } catch {
        throw new AppError(400, 'selectedPages doit être un JSON valide (tableau de numéros de page)', 'INVALID_SELECTED_PAGES');
      }
    }

   const document = await marcheDocumentsService.uploadDocument(
      {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        marcheId: req.body.marcheId,
        airportId: req.body.airportId,
        selectedPages,
        autoExtract: req.body.autoExtract,
      },
      req.user,
      req.tenantFilter
    );

    res.status(201).json(document);
  } catch (err) { next(err); }
}

export async function getStatusController(req, res, next) {
  try {
    res.json(await marcheDocumentsService.getStatus(req.params.id, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function attachController(req, res, next) {
  try {
    const document = await marcheDocumentsService.attachToMarche(req.params.id, req.body.marcheId, req.tenantFilter);
    res.json(document);
  } catch (err) { next(err); }
}

export async function compareController(req, res, next) {
  try {
    res.json(await marcheDocumentsService.compareWithMarche(req.params.id, req.tenantFilter));
  } catch (err) { next(err); }
}

export async function confirmController(req, res, next) {
  try {
    const marche = await marcheDocumentsService.confirmMerge(req.params.id, req.body.champs, req.tenantFilter);
    res.json(marche);
  } catch (err) { next(err); }
}
export async function downloadController(req, res, next) {
  try {
    const { buffer, originalName, mimeType } = await marcheDocumentsService.downloadDocument(req.params.id, req.tenantFilter);
    res.setHeader('Content-Type', mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.send(buffer);
  } catch (err) { next(err); }
}
export async function deleteController(req, res, next) {
  try {
    await marcheDocumentsService.deleteDocument(req.params.id, req.tenantFilter);
    // .send() et non .end() : le middleware auditLog intercepte res.send
    // pour tracer l'action. Avec .end(), qui court-circuite res.send, la
    // suppression ne serait jamais enregistrée dans le journal d'audit.
    res.status(204).send();
  } catch (err) { next(err); }
}
export async function triggerExtractionController(req, res, next) {
  try {
    res.json(await marcheDocumentsService.triggerExtraction(req.params.id, req.tenantFilter));
  } catch (err) { next(err); }
}