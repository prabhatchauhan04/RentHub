
/*
 * Handles HTTP requests for inquiries and landlord notifications.
 * Uses authenticated user identity to determine senders and recipients.
 */

import {
  createInquiry,
  getNotifications,
  getSentInquiries,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/inquiry.service.js";

import { inquiryQuerySchema } from "../validators/inquiry-query.validator.js";

// Creates an inquiry about a property.
export const create = async (req, res) => {
  const inquiry = await createInquiry(
    req.user.id,
    req.params.propertyId,
    req.body.message
  );

  res.status(201).json({
    success: true,
    message: "Inquiry sent successfully.",
    data: { inquiry },
  });
};

// Retrieves notifications received by the authenticated landlord.
export const getAllNotifications = async (req, res) => {
  const result = inquiryQuerySchema.safeParse(req.query);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Invalid notification query parameters.",
      details,
    });
  }

  const notifications = await getNotifications(
    req.user.id,
    result.data
  );

  res.status(200).json({
    success: true,
    data: notifications,
  });
};

// Retrieves inquiries sent by the authenticated tenant.
export const getSent = async (req, res) => {
  const inquiries = await getSentInquiries(req.user.id);

  res.status(200).json({
    success: true,
    data: { inquiries },
  });
};

// Marks one received notification as read.
export const markRead = async (req, res) => {
  const result = await markNotificationAsRead(
    req.params.inquiryId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      isRead: result.isRead,
    },
  });
};

// Marks all received notifications as read.
export const markAllRead = async (req, res) => {
  const result = await markAllNotificationsAsRead(req.user.id);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      updatedCount: result.updatedCount,
    },
  });
};
