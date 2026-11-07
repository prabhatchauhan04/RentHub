
/*
 * Contains business logic for tenant inquiries and landlord notifications.
 * Resolves recipients from property ownership and protects private messages.
 */

import { z } from "zod";

import { prisma } from "../config/prisma.js";
import AppError from "../utils/app-error.js";

const validateId = (id, label) => {
  if (!z.string().uuid().safeParse(id).success) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

// Shared selection for notification and inquiry responses.
const inquiryInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  recipient: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  property: {
    select: {
      id: true,
      title: true,
      propertyName: true,
      address: true,
      area: true,
      city: true,
      monthlyRent: true,
      images: {
        orderBy: {
          position: "asc",
        },
        take: 1,
        select: {
          imageUrl: true,
        },
      },
    },
  },
};

// Sends an inquiry from a tenant to the landlord of a property.
export const createInquiry = async (senderId, propertyId, message) => {
  validateId(propertyId, "property ID");

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!property) {
    throw new AppError("Property not found.", 404);
  }

  if (property.ownerId === senderId) {
    throw new AppError(
      "You cannot send an inquiry about your own property.",
      400
    );
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      message,
      senderId,
      recipientId: property.ownerId,
      propertyId: property.id,
    },
  });

  return prisma.inquiry.findUnique({
    where: { id: inquiry.id },
    include: inquiryInclude,
  });
};

// Retrieves notifications received by the authenticated landlord.
export const getNotifications = async (
  recipientId,
  { page, limit, unreadOnly }
) => {
  const where = {
    recipientId,
    ...(unreadOnly && { isRead: false }),
  };

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.inquiry.findMany({
      relationLoadStrategy: "join",
      where,
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      skip,
      take: limit,
      include: inquiryInclude,
    }),

    prisma.inquiry.count({ where }),

    prisma.inquiry.count({
      where: {
        recipientId,
        isRead: false,
      },
    }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Retrieves inquiries sent by the authenticated tenant.
export const getSentInquiries = async (senderId) => {
  return prisma.inquiry.findMany({
    relationLoadStrategy: "join",
    where: {
      senderId,
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    include: inquiryInclude,
  });
};

// Marks one notification as read by its recipient landlord.
export const markNotificationAsRead = async (
  inquiryId,
  recipientId
) => {
  validateId(inquiryId, "inquiry ID");

  const updated = await prisma.inquiry.updateMany({
    where: {
      id: inquiryId,
      recipientId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  if (updated.count > 0) {
    return {
      message: "Notification marked as read.",
      isRead: true,
    };
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: {
      id: inquiryId,
      recipientId,
    },
    select: {
      id: true,
    },
  });

  if (!inquiry) {
    throw new AppError("Notification not found.", 404);
  }

  return {
    message: "Notification is already marked as read.",
    isRead: true,
  };
};

// Marks every unread notification belonging to the landlord as read.
export const markAllNotificationsAsRead = async (recipientId) => {
  const result = await prisma.inquiry.updateMany({
    where: {
      recipientId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return {
    message: "All notifications marked as read.",
    updatedCount: result.count,
  };
};
