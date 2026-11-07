/*
 * Restricts routes to users with specified roles.
 * Must be used after the authentication middleware.
 */

import AppError from "../utils/app-error.js";

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403));
    }

    next();
  };
};

export default authorize;
