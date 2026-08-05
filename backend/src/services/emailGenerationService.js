import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { aiService } from '../ai/index.js';
import { buildEmailPrompt } from '../prompts/emailGeneration.prompts.js';
import { logger } from '../utils/logger.js';

async function getFactualData(reclamationId, tenantFilter) {
  const reclamation = await prisma.reclamation.findFirst({
    where: { id: reclamationId, ...tenantFilter, deletedAt: null },
    include: { panne: { include: { equipement: { include: { societe: true, marche: true } } } } },
  });
  if (!reclamation) throw new AppError(404, 'Réclamation introuvable', 'NOT_FOUND');

  const { panne } = reclamation;
  const { equipement } = panne;
  const { societe, marche } = equipement;

  return {
    societeNom: societe.raisonSociale,
    societeEmail: societe.emailContact,
    marcheNumero: marche.numeroMarche,
    equipementDesignation: equipement.designation,
    equipementLocalisation: equipement.localisation,
    panneDescription: panne.description,
    panneDate: panne.tPanne.toLocaleDateString('fr-FR'),
    reclamationObjet: reclamation.objet,
    reclamationStatut: reclamation.statut,
    tempsReactionMinutes: reclamation.tempsReactionMinutes,
    slaMrtMinutes: marche.slaMrt,
    conformeSla: reclamation.conformeSla,
  };
}

export async function generateEmail(reclamationId, tenantFilter, { type, urgence, signataire, fonction, contexteLibre }) {
  const factualData = await getFactualData(reclamationId, tenantFilter);
  const prompt = buildEmailPrompt(type, urgence, factualData, contexteLibre || null, signataire || null, fonction || null);

  logger.info(`✉️  [email-generation] Type ${type} (urgence ${urgence}) pour la réclamation ${reclamationId}`);
  const result = await aiService.structureText(prompt);

  if (!result.objet || !result.corps) {
    throw new AppError(502, "L'IA n'a pas retourné un email exploitable", 'AI_GENERATION_FAILED');
  }

  return { objet: result.objet, corps: result.corps, destinataireSuggere: factualData.societeEmail };
}