
/*
 * Handles HTTP requests for tenant favourite operations.
 * Uses the authenticated user's ID to manage their saved properties.
 */

import {
  addFavourite,
  getFavourites,
  removeFavourite,
} from "../services/favourite.service.js";

// Adds a property to favourites.
export const add = async (req, res) => {
  const favourite = await addFavourite(
    req.user.id,
    req.params.propertyId
  );

  res.status(201).json({
    success: true,
    message: "Property added to favourites successfully.",
    data: { favourite },
  });
};

// Retrieves the authenticated tenant's favourites.
export const getAll = async (req, res) => {
  const favourites = await getFavourites(req.user.id);

  res.status(200).json({
    success: true,
    data: { favourites },
  });
};

// Removes a property from favourites.
export const remove = async (req, res) => {
  const result = await removeFavourite(
    req.user.id,
    req.params.propertyId
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
};
