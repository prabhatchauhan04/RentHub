
/*
 * Provides centralized error handling for the RentHub API.
 * Prevents internal error details from being exposed in production.
 */

const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && isProduction
        ? "Internal server error."
        : err.message || "Something went wrong.",
    ...(err.details && { details: err.details }),
  });
};

export default errorMiddleware;
