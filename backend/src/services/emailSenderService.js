import { Resend } from 'resend';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ destinataire, objet, corps }) {
  if (!destinataire || !objet || !corps) {
    throw new AppError(400, 'destinataire, objet et corps sont requis pour envoyer un email', 'MISSING_EMAIL_FIELDS');
  }
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'Amnt ONDA <onboarding@resend.dev>',
      to: destinataire,
      subject: objet,
      text: corps,
    });
    if (error) throw new Error(error.message || 'Erreur Resend');
    logger.info(`✉️  [email-sender] Email envoyé à ${destinataire} (messageId: ${data.id})`);
    return { messageId: data.id };
  } catch (err) {
    logger.error({ err }, `❌ [email-sender] Échec de l'envoi à ${destinataire}`);
    throw new AppError(502, `Échec de l'envoi de l'email : ${err.message}`, 'EMAIL_SEND_FAILED');
  }
}