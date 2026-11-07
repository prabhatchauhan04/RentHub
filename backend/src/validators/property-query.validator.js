
/*
 * Validates property search, filtering, sorting and pagination parameters.
 * Converts query-string values into the types used by the property service.
 */

import { z } from "zod";

// Converts optional query-string numbers into numeric values.
const optionalNumber = z.preprocess(
  (value) => {
    if (value === undefined || value === "") {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  },
  z.number().nonnegative().optional()
);

// Converts comma-separated amenities into a normalized array.
const parseAmenities = z.preprocess(
  (value) => {
    if (value === undefined || value === "") {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value;
    }

    return String(value)
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean);
  },
  z.array(z.string().min(1).max(100)).max(30).optional()
);

// Validates property listing search and filter parameters.
export const propertyQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  city: z.string().trim().max(100).optional(),
  area: z.string().trim().max(100).optional(),

  minRent: optionalNumber,
  maxRent: optionalNumber,

  minSquareFeet: optionalNumber,
  maxSquareFeet: optionalNumber,

  propertyType: z.enum(["APARTMENT", "BUILDING"]).optional(),
  leaseType: z.enum(["LONG_TERM", "SHORT_TERM", "BOTH"]).optional(),
  priceMode: z.enum(["PER_MONTH", "UTILITIES_INCLUDED"]).optional(),
  furnishingStatus: z.enum(["FURNISHED", "UNFURNISHED"]).optional(),

  vegetarianPreference: z.enum([
    "VEGETARIAN_ONLY",
    "NO_PREFERENCE",
  ]).optional(),

  sharedProperty: z.enum(["true", "false"]).optional(),

  amenities: parseAmenities,

  sort: z.enum([
    "newest",
    "oldest",
    "rent_asc",
    "rent_desc",
  ]).default("newest"),

  page: z.preprocess(
    (value) => value === undefined ? 1 : Number(value),
    z.number().int().positive().default(1)
  ),

  limit: z.preprocess(
    (value) => value === undefined ? 10 : Number(value),
    z.number().int().positive().max(50).default(10)
  ),
})
.refine(
  (filters) =>
    filters.minRent === undefined ||
    filters.maxRent === undefined ||
    filters.minRent <= filters.maxRent,
  {
    message: "Minimum rent cannot exceed maximum rent.",
    path: ["maxRent"],
  }
)
.refine(
  (filters) =>
    filters.minSquareFeet === undefined ||
    filters.maxSquareFeet === undefined ||
    filters.minSquareFeet <= filters.maxSquareFeet,
  {
    message: "Minimum square feet cannot exceed maximum square feet.",
    path: ["maxSquareFeet"],
  }
);
