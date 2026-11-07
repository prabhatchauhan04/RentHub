/*
 * Defines public and protected authentication endpoints.
 * Applies request validation and JWT authentication where required.
 */

import { Router } from "express";

import {
  register,
  login,
  getCurrentUser,
} from "../controllers/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/async-handler.js";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(register)
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(login)
);

router.get(
  "/me",
  authMiddleware,
  asyncHandler(getCurrentUser)
);

export default router;
