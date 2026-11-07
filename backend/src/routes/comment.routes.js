
/*
 * Defines public comment retrieval and protected comment operations.
 * Requires authentication for creating replies and deleting comments.
 */

import { Router } from "express";

import {
  getAll,
  create,
  reply,
  remove,
} from "../controllers/comment.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/async-handler.js";

import { commentSchema } from "../validators/comment.validator.js";

const router = Router();

// Retrieve comments for a property without authentication.
router.get(
  "/properties/:propertyId/comments",
  asyncHandler(getAll)
);

// Create a top-level comment.
router.post(
  "/properties/:propertyId/comments",
  authMiddleware,
  validate(commentSchema),
  asyncHandler(create)
);

// Reply to a top-level comment.
router.post(
  "/properties/:propertyId/comments/:commentId/replies",
  authMiddleware,
  validate(commentSchema),
  asyncHandler(reply)
);

// Delete an owned comment or reply.
router.delete(
  "/comments/:commentId",
  authMiddleware,
  asyncHandler(remove)
);

export default router;
