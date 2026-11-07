/*
 * Generates secure upload signatures for Cloudinary.
 * Restricts uploads to the configured RentHub property image folder.
 */

import cloudinary from "../config/cloudinary.js";
import AppError from "../utils/app-error.js";

export const generateUploadSignature = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || "renthub/properties";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError("Cloudinary is not configured.", 500);
  }

  const timestamp = Math.floor(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret
  );

  return {
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature,
  };
};
