import nodemailer from 'nodemailer';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true, // true pour le port 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  family: 4,
  connectionTimeout: 10_000,
});
 

export async function sendEmail({ destinataire, objet, corps }) {
  if (!destinataire || !objet || !corps) {
    throw new AppError(400, 'destinataire, objet et corps sont requis pour envoyer un email', 'MISSING_EMAIL_FIELDS');
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: destinataire,
      subject: objet,
      text: corps,
    });
    logger.info(`✉️  [email-sender] Email envoyé à ${destinataire} (messageId: ${info.messageId})`);
    return { messageId: info.messageId };
  } catch (err) {
    logger.error({ err }, `❌ [email-sender] Échec de l'envoi à ${destinataire}`);
    throw new AppError(502, `Échec de l'envoi de l'email : ${err.message}`, 'EMAIL_SEND_FAILED');
  }
}