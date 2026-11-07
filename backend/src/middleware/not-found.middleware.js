
/*
 * Handles requests that do not match any registered API route.
 * Returns a consistent JSON response for missing endpoints.
 */

const notFoundMiddleware = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export default notFoundMiddleware;
