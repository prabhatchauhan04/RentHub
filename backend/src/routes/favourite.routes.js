
/*
 * Defines protected endpoints for managing tenant favourites.
 * Only authenticated tenants can access these routes.
 */

import { Router } from "express";

import {
  add,
  getAll,
  remove,
} from "../controllers/favourite.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import authorize from "../middleware/authorize.middleware.js";
import asyncHandler from "../utils/async-handler.js";

const router = Router();

// All favourite routes require tenant authentication.
router.use(authMiddleware);
router.use(authorize("TENANT"));

// Retrieve all saved properties.
router.get("/", asyncHandler(getAll));

// Add a property to favourites.
router.post("/:propertyId", asyncHandler(add));

// Remove a property from favourites.
router.delete("/:propertyId", asyncHandler(remove));

export default router;
