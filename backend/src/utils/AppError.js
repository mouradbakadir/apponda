export class AppError extends Error {
    constructor(statusCode, message, code = 'ERROR') {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
    }
  }