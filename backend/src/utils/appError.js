export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

export const createError = (message, statusCode = 500, details = null) =>
  new AppError(message, statusCode, details);
