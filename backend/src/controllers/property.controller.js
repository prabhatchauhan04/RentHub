
/*
 * Handles HTTP requests for property listing operations.
 * Passes authenticated landlord details and validated data to services.
 */

import {
  createProperty,
  getProperties,
  getFeaturedProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getLandlordProperties,
} from "../services/property.service.js";

import { generateUploadSignature } from "../services/cloudinary.service.js";
import { propertyQuerySchema } from "../validators/property-query.validator.js";

// Creates a property listing.
export const create = async (req, res) => {
  const property = await createProperty(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: "Property created successfully.",
    data: { property },
  });
};

// Retrieves active properties with search, filters and pagination.
export const getAll = async (req, res) => {
  const result = propertyQuerySchema.safeParse(req.query);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Invalid property search parameters.",
      details,
    });
  }

  const properties = await getProperties(result.data);

  res.status(200).json({
    success: true,
    data: properties,
  });
};

// Retrieves featured properties for the home carousel.
export const getFeatured = async (req, res) => {
  const properties = await getFeaturedProperties();

  res.status(200).json({
    success: true,
    data: { properties },
  });
};

// Retrieves an individual property.
export const getOne = async (req, res) => {
  const property = await getPropertyById(req.params.id);

  res.status(200).json({
    success: true,
    data: { property },
  });
};

// Updates a property owned by the authenticated landlord.
export const update = async (req, res) => {
  const property = await updateProperty(
    req.params.id,
    req.user.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Property updated successfully.",
    data: { property },
  });
};

// Deletes a property owned by the authenticated landlord.
export const remove = async (req, res) => {
  const result = await deleteProperty(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
};

// Retrieves all properties belonging to the authenticated landlord.
export const getMine = async (req, res) => {
  const properties = await getLandlordProperties(req.user.id);

  res.status(200).json({
    success: true,
    data: { properties },
  });
};

// Generates a signed Cloudinary upload request.
export const getImageUploadSignature = async (req, res) => {
  const signature = generateUploadSignature();

  res.status(200).json({
    success: true,
    data: signature,
  });
};
