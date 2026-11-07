
/*
 * Wraps asynchronous Express route handlers.
 * Forwards rejected promises to the centralized error middleware.
 */

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export default asyncHandler;
