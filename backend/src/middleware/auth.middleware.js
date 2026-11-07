
/*
 * Protects private API routes using JWT authentication.
 * Attaches the verified user ID and role to the request.
 */

import jwt from "jsonwebtoken";
import AppError from "../utils/app-error.js";

const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new AppError("Authentication required.", 401));
  }

  const token = authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof decoded !== "object" ||
      !decoded.sub ||
      !["TENANT", "LANDLORD"].includes(decoded.role)
    ) {
      throw new Error("Invalid token payload.");
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch {
    next(new AppError("Invalid or expired token.", 401));
  }
};

export default authMiddleware;
