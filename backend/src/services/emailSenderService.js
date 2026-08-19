import nodemailer from 'nodemailer';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Force la résolution en IPv4 -- le réseau sortant de certains hébergeurs
  // cloud (dont Railway) ne route pas correctement l'IPv6 vers l'extérieur,
  // ce qui provoque un blocage de ~2 minutes puis une erreur ENETUNREACH
  // sur les adresses IPv6 renvoyées par la résolution DNS de Gmail.
  family: 4,
});
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  family: 4,
  connectionTimeout: 10_000, // 10s max pour établir la connexion, au lieu d'attendre indéfiniment
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