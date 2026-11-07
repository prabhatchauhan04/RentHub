
/*
 * Defines public and protected property listing endpoints.
 * Restricts property management and image uploads to authenticated landlords.
 */

import { Router } from "express";

import {
  create,
  getAll,
  getFeatured,
  getOne,
  update,
  remove,
  getMine,
  getImageUploadSignature,
} from "../controllers/property.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import authorize from "../middleware/authorize.middleware.js";
import validate from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/async-handler.js";

import {
  createPropertySchema,
  updatePropertySchema,
} from "../validators/property.validator.js";

const router = Router();

// Public property endpoints.
router.get("/", asyncHandler(getAll));

router.get("/featured", asyncHandler(getFeatured));

router.get(
  "/mine",
  authMiddleware,
  authorize("LANDLORD"),
  asyncHandler(getMine)
);

// Protected landlord image upload endpoint.
router.post(
  "/image-signature",
  authMiddleware,
  authorize("LANDLORD"),
  asyncHandler(getImageUploadSignature)
);

// Dynamic property endpoint.
router.get("/:id", asyncHandler(getOne));

// Protected landlord property management endpoints.
router.post(
  "/",
  authMiddleware,
  authorize("LANDLORD"),
  validate(createPropertySchema),
  asyncHandler(create)
);

router.put(
  "/:id",
  authMiddleware,
  authorize("LANDLORD"),
  validate(updatePropertySchema),
  asyncHandler(update)
);

router.delete(
  "/:id",
  authMiddleware,
  authorize("LANDLORD"),
  asyncHandler(remove)
);

export default router;
