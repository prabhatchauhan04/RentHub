
/*
 * Defines inquiry and notification endpoints.
 * Restricts inquiry creation to tenants and notification management to landlords.
 */

import { Router } from "express";

import {
  create,
  getAllNotifications,
  getSent,
  markRead,
  markAllRead,
} from "../controllers/inquiry.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import authorize from "../middleware/authorize.middleware.js";
import validate from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/async-handler.js";

import { inquirySchema } from "../validators/inquiry.validator.js";

const router = Router();

// Every inquiry endpoint requires authentication.
router.use(authMiddleware);

// Tenant endpoints.
router.post(
  "/properties/:propertyId/inquiries",
  authorize("TENANT"),
  validate(inquirySchema),
  asyncHandler(create)
);

router.get(
  "/inquiries/sent",
  authorize("TENANT"),
  asyncHandler(getSent)
);

// Landlord notification endpoints.
router.get(
  "/inquiries/notifications",
  authorize("LANDLORD"),
  asyncHandler(getAllNotifications)
);

router.patch(
  "/inquiries/read-all",
  authorize("LANDLORD"),
  asyncHandler(markAllRead)
);

router.patch(
  "/inquiries/:inquiryId/read",
  authorize("LANDLORD"),
  asyncHandler(markRead)
);

export default router;
