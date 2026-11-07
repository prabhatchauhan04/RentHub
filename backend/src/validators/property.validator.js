
/*
 * Validates property creation and update requests.
 * Enforces assignment field requirements and safe image metadata.
 */

import { z } from "zod";

const propertyTypeValues = ["APARTMENT", "BUILDING"];
const leaseTypeValues = ["LONG_TERM", "SHORT_TERM", "BOTH"];
const priceModeValues = ["PER_MONTH", "UTILITIES_INCLUDED"];
const furnishingValues = ["FURNISHED", "UNFURNISHED"];
const vegetarianValues = ["VEGETARIAN_ONLY", "NO_PREFERENCE"];

const imageSchema = z.object({
  imageUrl: z.string().url(),
  publicId: z.string().min(1).max(255),
});

const amenitiesSchema = z.array(
  z.string().trim().min(1).max(100)
).max(30);

const propertyFields = {
  propertyType: z.enum(propertyTypeValues),
  propertyName: z.string().trim().min(2).max(150),
  sharedProperty: z.boolean(),
  address: z.string().trim().min(5).max(255),
  area: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(4).max(12),
  squareFeet: z.number().int().positive().max(1000000),
  leaseType: z.enum(leaseTypeValues),
  monthlyRent: z.number().positive().max(100000000),
  isNegotiable: z.boolean(),
  priceMode: z.enum(priceModeValues),
  furnishingStatus: z.enum(furnishingValues),
  vegetarianPreference: z.enum(vegetarianValues),
  contactPhone: z.string().trim().min(7).max(20).nullable().optional(),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10).max(1400),
  amenities: amenitiesSchema,
  images: z.array(imageSchema).max(10),
};

// Validates a new property listing.
export const createPropertySchema = z.object({
  ...propertyFields,
});

// Validates partial updates to an existing property.
export const updatePropertySchema = z.object({
  propertyType: propertyFields.propertyType.optional(),
  propertyName: propertyFields.propertyName.optional(),
  sharedProperty: propertyFields.sharedProperty.optional(),
  address: propertyFields.address.optional(),
  area: propertyFields.area.optional(),
  city: propertyFields.city.optional(),
  state: propertyFields.state.optional(),
  postalCode: propertyFields.postalCode.optional(),
  squareFeet: propertyFields.squareFeet.optional(),
  leaseType: propertyFields.leaseType.optional(),
  monthlyRent: propertyFields.monthlyRent.optional(),
  isNegotiable: propertyFields.isNegotiable.optional(),
  priceMode: propertyFields.priceMode.optional(),
  furnishingStatus: propertyFields.furnishingStatus.optional(),
  vegetarianPreference: propertyFields.vegetarianPreference.optional(),
  contactPhone: propertyFields.contactPhone,
  title: propertyFields.title.optional(),
  description: propertyFields.description.optional(),
  amenities: propertyFields.amenities.optional(),
  images: propertyFields.images.optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "RENTED"]).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one property field must be provided.",
  }
);
