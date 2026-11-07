
/*
 * Contains business logic for property comments and replies.
 * Handles comment retrieval, reply validation and author-only deletion.
 */

import { z } from "zod";

import { prisma } from "../config/prisma.js";
import AppError from "../utils/app-error.js";

const validateId = (id, label) => {
  if (!z.string().uuid().safeParse(id).success) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const commentInclude = {
  user: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
};

const replyInclude = {
  ...commentInclude,
};

// Retrieves all top-level comments and their replies for a property.
export const getPropertyComments = async (propertyId) => {
  validateId(propertyId, "property ID");

  const property = await prisma.property.findFirst({
    relationLoadStrategy: "join",
    where: {
      id: propertyId,
      status: "ACTIVE",
    },
    select: {
      comments: {
        where: {
          parentId: null,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          ...commentInclude,
          replies: {
            orderBy: {
              createdAt: "asc",
            },
            include: replyInclude,
          },
        },
      },
    },
  });

  if (!property) {
    throw new AppError("Property not found.", 404);
  }

  return property.comments;
};

// Creates a top-level comment on an active property.
export const createComment = async (propertyId, userId, content) => {
  validateId(propertyId, "property ID");

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (!property) {
    throw new AppError("Property not found.", 404);
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      propertyId,
      userId,
    },
  });

  return prisma.comment.findUnique({
    where: { id: comment.id },
    include: commentInclude,
  });
};

// Creates a reply to an existing top-level comment.
export const createReply = async (
  propertyId,
  commentId,
  userId,
  content
) => {
  validateId(propertyId, "property ID");
  validateId(commentId, "comment ID");

  const parentComment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      propertyId,
      parentId: null,
      property: {
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
    },
  });

  if (!parentComment) {
    throw new AppError(
      "Comment not found or it cannot receive replies.",
      404
    );
  }

  const reply = await prisma.comment.create({
    data: {
      content,
      propertyId,
      userId,
      parentId: commentId,
    },
  });

  return prisma.comment.findUnique({
    where: { id: reply.id },
    include: replyInclude,
  });
};

// Deletes a comment or reply created by the authenticated user.
export const deleteComment = async (commentId, userId) => {
  validateId(commentId, "comment ID");

  const deleted = await prisma.comment.deleteMany({
    where: {
      id: commentId,
      userId,
    },
  });

  if (deleted.count === 0) {
    const comment = await prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        userId: true,
      },
    });

    if (!comment) {
      throw new AppError("Comment not found.", 404);
    }

    throw new AppError(
      "You can only delete your own comments.",
      403
    );
  }

  return {
    message: "Comment deleted successfully.",
  };
};
