
/*
 * Contains business logic for tenant favourite operations.
 * Prevents duplicate favourites and retrieves saved property details.
 */

import { z } from "zod";

import { prisma } from "../config/prisma.js";
import AppError from "../utils/app-error.js";

const favouriteInclude = {
  property: {
    include: {
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
      images: {
        orderBy: {
          position: "asc",
        },
      },
      amenities: {
        include: {
          amenity: true,
        },
      },
    },
  },
};

const validatePropertyId = (propertyId) => {
  if (!z.string().uuid().safeParse(propertyId).success) {
    throw new AppError("Invalid property ID.", 400);
  }
};

const formatFavourite = (favourite) => ({
  property: {
    ...favourite.property,
    amenities: favourite.property.amenities.map(
      (item) => item.amenity.name
    ),
  },
  favouritedAt: favourite.createdAt,
});

// Adds a property to the tenant's favourites.
export const addFavourite = async (userId, propertyId) => {
  validatePropertyId(propertyId);

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

  let favourite;

  try {
    await prisma.favourite.create({
      data: {
        userId,
        propertyId,
      },
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new AppError(
        "Property is already in your favourites.",
        409
      );
    }

    throw error;
  }

  favourite = await prisma.favourite.findUnique({
    where: {
      userId_propertyId: {
        userId,
        propertyId,
      },
    },
    include: favouriteInclude,
  });

  return formatFavourite(favourite);
};

// Retrieves all active saved properties belonging to the tenant.
export const getFavourites = async (userId) => {
  const favourites = await prisma.favourite.findMany({
    relationLoadStrategy: "join",
    where: {
      userId,
      property: {
        status: "ACTIVE",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: favouriteInclude,
  });

  return favourites.map(formatFavourite);
};

// Removes a property from the tenant's favourites.
export const removeFavourite = async (userId, propertyId) => {
  validatePropertyId(propertyId);

  try {
    await prisma.favourite.delete({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });
  } catch (error) {
    if (error?.code === "P2025") {
      throw new AppError(
        "Property is not in your favourites.",
        404
      );
    }

    throw error;
  }

  return {
    message: "Property removed from favourites successfully.",
  };
};
