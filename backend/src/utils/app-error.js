
/*
 * Defines a consistent application error with an HTTP status code.
 * Supports additional details for validation and other API errors.
 */

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export default AppError;
