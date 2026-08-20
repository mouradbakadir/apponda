import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export async function sendEmail({ destinataire, objet, corps }) {
  if (!destinataire || !objet || !corps) {
    throw new AppError(
      400,
      'destinataire, objet et corps sont requis pour envoyer un email',
      'MISSING_EMAIL_FIELDS'
    );
  }

  try {
    const response = await fetch(
      'https://api.brevo.com/v3/smtp/email',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: {
            name: 'AMNT ONDA',
            email: process.env.BREVO_FROM,
          },
          to: [
            {
              email: destinataire,
            },
          ],
          subject: objet,
          textContent: corps,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || 'Erreur lors de l’envoi avec Brevo'
      );
    }

    logger.info(
      `✉️ [email-sender] Email envoyé à ${destinataire} (messageId: ${result.messageId})`
    );

    return {
      messageId: result.messageId,
    };

  } catch (err) {
    logger.error(
      { err },
      `❌ [email-sender] Échec de l'envoi à ${destinataire}`
    );

    throw new AppError(
      502,
      `Échec de l'envoi de l'email : ${err.message}`,
      'EMAIL_SEND_FAILED'
    );
  }
}