export class AppError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details; // <-- NOUVEAU: Permet de stocker la liste des champs en erreur
  }
}