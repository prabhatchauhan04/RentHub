
/*
 * Defines shared data models used throughout RentHub.
 * These interfaces represent the data exchanged between the frontend and backend.
 */

export const DEFAULT_PROPERTY_PLACEHOLDER =
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23e2e8f0"/><path d="M300 130L180 230H220V310H280V250H320V310H380V230H420L300 130Z" fill="%2394a3b8"/><circle cx="300" cy="190" r="16" fill="%23e2e8f0"/><text x="300" y="345" font-family="Arial,sans-serif" font-size="18" font-weight="600" fill="%2364748b" text-anchor="middle">No Image Available</text></svg>`;

export type Role = 'TENANT' | 'LANDLORD';

export type PropertyType = 'APARTMENT' | 'BUILDING';

export type LeaseType = 'LONG_TERM' | 'SHORT_TERM' | 'BOTH';

export type PriceMode = 'PER_MONTH' | 'UTILITIES_INCLUDED';

export type FurnishingStatus = 'FURNISHED' | 'UNFURNISHED';

export type VegetarianPreference = 'VEGETARIAN_ONLY' | 'NO_PREFERENCE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface PropertyImage {
  id?: string;
  imageUrl: string;
  publicId: string;
  position?: number;
}

export interface PropertyAmenity {
  id?: string;
  name?: string;
  amenity?: {
    id?: string;
    name: string;
  };
}

export interface Property {
  id: string;
  propertyType: PropertyType;
  propertyName: string;
  sharedProperty: boolean;
  address: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  squareFeet: number;
  leaseType: LeaseType;
  monthlyRent: number | string;
  isNegotiable: boolean;
  priceMode: PriceMode;
  furnishingStatus: FurnishingStatus;
  vegetarianPreference: VegetarianPreference;
  contactPhone?: string | null;
  title: string;
  description: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'RENTED';
  ownerId?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  images: PropertyImage[];
  amenities: PropertyAmenity[];
  createdAt: string;
  updatedAt?: string;
}

export interface PropertyPayload {
  propertyType: PropertyType;
  propertyName: string;
  sharedProperty: boolean;
  address: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  squareFeet: number;
  leaseType: LeaseType;
  monthlyRent: number;
  isNegotiable: boolean;
  priceMode: PriceMode;
  furnishingStatus: FurnishingStatus;
  vegetarianPreference: VegetarianPreference;
  contactPhone: string | null;
  title: string;
  description: string;
  amenities: string[];
  images: PropertyImage[];
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
  replies?: CommentItem[];
}

export interface Inquiry {
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  property: Property;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
