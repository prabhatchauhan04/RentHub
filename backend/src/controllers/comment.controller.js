
/*
 * Handles HTTP requests for property comments and replies.
 * Uses authenticated user details when creating or deleting comments.
 */

import {
  getPropertyComments,
  createComment,
  createReply,
  deleteComment,
} from "../services/comment.service.js";

// Retrieves comments and their replies for a property.
export const getAll = async (req, res) => {
  const comments = await getPropertyComments(req.params.propertyId);

  res.status(200).json({
    success: true,
    data: { comments },
  });
};

// Creates a top-level property comment.
export const create = async (req, res) => {
  const comment = await createComment(
    req.params.propertyId,
    req.user.id,
    req.body.content
  );

  res.status(201).json({
    success: true,
    message: "Comment added successfully.",
    data: { comment },
  });
};

// Creates a reply to an existing top-level comment.
export const reply = async (req, res) => {
  const comment = await createReply(
    req.params.propertyId,
    req.params.commentId,
    req.user.id,
    req.body.content
  );

  res.status(201).json({
    success: true,
    message: "Reply added successfully.",
    data: { comment },
  });
};

// Deletes a comment or reply owned by the authenticated user.
export const remove = async (req, res) => {
  const result = await deleteComment(
    req.params.commentId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
};
