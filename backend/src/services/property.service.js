
/*
 * Contains business logic for property listing operations.
 * Handles CRUD, search, filtering, featured listings, images and ownership.
 */

import { prisma } from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
import AppError from "../utils/app-error.js";

// Relations included whenever property details are retrieved.
const propertyInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
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
};

// Converts database property records into API response objects.
const formatProperty = (property) => ({
  ...property,
  amenities: property.amenities.map((item) => item.amenity.name),
});

// Removes duplicate amenity names.
const normalizeAmenities = (amenities = []) => [
  ...new Set(
    amenities.map((name) => name.trim().toLowerCase())
  ),
];

// Ensures every amenity exists before relations are connected.
const ensureAmenities = async (amenities) => {
  if (amenities.length === 0) {
    return;
  }

  // `skipDuplicates` makes the preliminary read unnecessary while preserving
  // the same set of amenities and remaining safe for concurrent requests.
  await prisma.amenity.createMany({
    data: amenities.map((name) => ({ name })),
    skipDuplicates: true,
  });
};

// Retrieves the IDs used for batched property-amenity relation inserts.
const getAmenityIds = async (amenities) => {
  if (amenities.length === 0) {
    return [];
  }

  const records = await prisma.amenity.findMany({
    where: {
      name: {
        in: amenities,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const idsByName = new Map(
    records.map((amenity) => [amenity.name, amenity.id])
  );

  return amenities.map((name) => idsByName.get(name));
};

// Creates nested batch relations after the amenity IDs have been resolved.
const createAmenityRelations = (amenityIds) => ({
  createMany: {
    data: amenityIds.map((amenityId) => ({ amenityId })),
  },
});

// Deletes Cloudinary images without failing the database operation.
const deleteCloudinaryImages = async (images) => {
  await Promise.allSettled(
    images.map((image) =>
      cloudinary.uploader.destroy(image.publicId)
    )
  );
};

// Builds database filters from validated search parameters.
const buildPropertyWhere = (filters) => {
  const {
    search,
    city,
    area,
    minRent,
    maxRent,
    minSquareFeet,
    maxSquareFeet,
    propertyType,
    leaseType,
    priceMode,
    furnishingStatus,
    vegetarianPreference,
    sharedProperty,
    amenities,
  } = filters;

  const where = {
    status: "ACTIVE",
  };

  // Search across the main property text fields.
  if (search) {
    where.OR = [
      {
        propertyName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        address: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        area: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        city: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (city) {
    where.city = {
      contains: city,
      mode: "insensitive",
    };
  }

  if (area) {
    where.area = {
      contains: area,
      mode: "insensitive",
    };
  }

  if (minRent !== undefined || maxRent !== undefined) {
    where.monthlyRent = {
      ...(minRent !== undefined && { gte: minRent }),
      ...(maxRent !== undefined && { lte: maxRent }),
    };
  }

  if (minSquareFeet !== undefined || maxSquareFeet !== undefined) {
    where.squareFeet = {
      ...(minSquareFeet !== undefined && { gte: minSquareFeet }),
      ...(maxSquareFeet !== undefined && { lte: maxSquareFeet }),
    };
  }

  if (propertyType) {
    where.propertyType = propertyType;
  }

  if (leaseType) {
    where.leaseType = leaseType;
  }

  if (priceMode) {
    where.priceMode = priceMode;
  }

  if (furnishingStatus) {
    where.furnishingStatus = furnishingStatus;
  }

  if (vegetarianPreference) {
    where.vegetarianPreference = vegetarianPreference;
  }

  if (sharedProperty !== undefined) {
    where.sharedProperty = sharedProperty === "true";
  }

  // Every selected amenity must be present on the property.
  if (amenities?.length) {
    where.AND = amenities.map((name) => ({
      amenities: {
        some: {
          amenity: {
            name: {
              equals: name,
              mode: "insensitive",
            },
          },
        },
      },
    }));
  }

  return where;
};

// Determines property ordering based on the selected sort option.
const getPropertySort = (sort) => {
  const sortOptions = {
    newest: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    oldest: [
      { createdAt: "asc" },
      { id: "asc" },
    ],
    rent_asc: [
      { monthlyRent: "asc" },
      { id: "asc" },
    ],
    rent_desc: [
      { monthlyRent: "desc" },
      { id: "desc" },
    ],
  };

  return sortOptions[sort] || sortOptions.newest;
};

// Creates a new property listing.
export const createProperty = async (ownerId, data) => {
  const amenities = normalizeAmenities(data.amenities);

  await ensureAmenities(amenities);
  const amenityIds = await getAmenityIds(amenities);

  const property = await prisma.property.create({
    relationLoadStrategy: "join",
    data: {
      propertyType: data.propertyType,
      propertyName: data.propertyName,
      sharedProperty: data.sharedProperty,
      address: data.address,
      area: data.area,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      squareFeet: data.squareFeet,
      leaseType: data.leaseType,
      monthlyRent: data.monthlyRent,
      isNegotiable: data.isNegotiable,
      priceMode: data.priceMode,
      furnishingStatus: data.furnishingStatus,
      vegetarianPreference: data.vegetarianPreference,
      contactPhone: data.contactPhone,
      title: data.title,
      description: data.description,
      ownerId,

      amenities: createAmenityRelations(amenityIds),

      images: {
        create: (data.images || []).map((image, index) => ({
          imageUrl: image.imageUrl,
          publicId: image.publicId,
          position: index,
        })),
      },
    },
    include: propertyInclude,
  });

  return formatProperty(property);
};

// Retrieves active properties using search, filters, sorting and pagination.
export const getProperties = async (filters) => {
  const { page, limit, sort } = filters;

  const where = buildPropertyWhere(filters);
  const orderBy = getPropertySort(sort);
  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      relationLoadStrategy: "join",
      where,
      skip,
      take: limit,
      orderBy,
      include: propertyInclude,
    }),

    prisma.property.count({
      where,
    }),
  ]);

  return {
    properties: properties.map(formatProperty),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};


// Retrieves the five newest active properties for the home carousel.
export const getFeaturedProperties = async () => {
  const properties = await prisma.property.findMany({
    relationLoadStrategy: "join",
    where: {
      status: "ACTIVE",
    },
    take: 5,
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    include: propertyInclude,
  });

  return properties.map(formatProperty);
};

// Retrieves an individual active property.
export const getPropertyById = async (propertyId) => {
  const property = await prisma.property.findFirst({
    relationLoadStrategy: "join",
    where: {
      id: propertyId,
      status: "ACTIVE",
    },
    include: propertyInclude,
  });

  if (!property) {
    throw new AppError("Property not found.", 404);
  }

  return formatProperty(property);
};

// Updates an existing property owned by the authenticated landlord.
export const updateProperty = async (propertyId, ownerId, data) => {
  const existingProperty = await prisma.property.findUnique({
    relationLoadStrategy: "join",
    where: { id: propertyId },
    include: {
      images: true,
    },
  });

  if (!existingProperty) {
    throw new AppError("Property not found.", 404);
  }

  if (existingProperty.ownerId !== ownerId) {
    throw new AppError(
      "You cannot modify another landlord's property.",
      403
    );
  }

  const updateData = {
    ...(data.propertyType !== undefined && {
      propertyType: data.propertyType,
    }),
    ...(data.propertyName !== undefined && {
      propertyName: data.propertyName,
    }),
    ...(data.sharedProperty !== undefined && {
      sharedProperty: data.sharedProperty,
    }),
    ...(data.address !== undefined && {
      address: data.address,
    }),
    ...(data.area !== undefined && {
      area: data.area,
    }),
    ...(data.city !== undefined && {
      city: data.city,
    }),
    ...(data.state !== undefined && {
      state: data.state,
    }),
    ...(data.postalCode !== undefined && {
      postalCode: data.postalCode,
    }),
    ...(data.squareFeet !== undefined && {
      squareFeet: data.squareFeet,
    }),
    ...(data.leaseType !== undefined && {
      leaseType: data.leaseType,
    }),
    ...(data.monthlyRent !== undefined && {
      monthlyRent: data.monthlyRent,
    }),
    ...(data.isNegotiable !== undefined && {
      isNegotiable: data.isNegotiable,
    }),
    ...(data.priceMode !== undefined && {
      priceMode: data.priceMode,
    }),
    ...(data.furnishingStatus !== undefined && {
      furnishingStatus: data.furnishingStatus,
    }),
    ...(data.vegetarianPreference !== undefined && {
      vegetarianPreference: data.vegetarianPreference,
    }),
    ...(data.contactPhone !== undefined && {
      contactPhone: data.contactPhone,
    }),
    ...(data.title !== undefined && {
      title: data.title,
    }),
    ...(data.description !== undefined && {
      description: data.description,
    }),
    ...(data.status !== undefined && {
      status: data.status,
    }),
  };

  // Replace amenities only when the request explicitly includes them.
  if (data.amenities !== undefined) {
    const amenities = normalizeAmenities(data.amenities);

    await ensureAmenities(amenities);
    const amenityIds = await getAmenityIds(amenities);

    updateData.amenities = {
      deleteMany: {},
      ...createAmenityRelations(amenityIds),
    };
  }

  // Replace images only when the request explicitly includes them.
  if (data.images !== undefined) {
    updateData.images = {
      deleteMany: {},
      create: data.images.map((image, index) => ({
        imageUrl: image.imageUrl,
        publicId: image.publicId,
        position: index,
      })),
    };
  }

  const updatedProperty = await prisma.property.update({
    where: {
      id: propertyId,
    },
    data: updateData,
  });

  const fullProperty = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
    include: propertyInclude,
  });

  // Remove old Cloudinary images only after the database update succeeds.
  if (data.images !== undefined) {
    const newPublicIds = new Set(
      data.images.map((image) => image.publicId)
    );

    const removedImages = existingProperty.images.filter(
      (image) => !newPublicIds.has(image.publicId)
    );

    await deleteCloudinaryImages(removedImages);
  }

  return formatProperty(fullProperty);
};

// Deletes a property owned by the authenticated landlord.
export const deleteProperty = async (propertyId, ownerId) => {
  const property = await prisma.property.findUnique({
    relationLoadStrategy: "join",
    where: { id: propertyId },
    include: {
      images: true,
    },
  });

  if (!property) {
    throw new AppError("Property not found.", 404);
  }

  if (property.ownerId !== ownerId) {
    throw new AppError(
      "You cannot delete another landlord's property.",
      403
    );
  }

  await prisma.property.delete({
    where: {
      id: propertyId,
    },
  });

  await deleteCloudinaryImages(property.images);

  return {
    message: "Property deleted successfully.",
  };
};

// Retrieves all properties belonging to the authenticated landlord.
export const getLandlordProperties = async (ownerId) => {
  const properties = await prisma.property.findMany({
    relationLoadStrategy: "join",
    where: {
      ownerId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: propertyInclude,
  });

  return properties.map(formatProperty);
};
