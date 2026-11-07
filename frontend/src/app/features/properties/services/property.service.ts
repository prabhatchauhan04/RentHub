
/*
 * Handles property-related API operations for RentHub.
 * Connects property pages to the Express backend.
 */

import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import {
  Property,
  PropertyPayload,
  Pagination
} from '../../../core/models/models';

export interface PropertyFilters {
  search?: string;
  city?: string;
  area?: string;
  minRent?: number;
  maxRent?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  propertyType?: string;
  leaseType?: string;
  priceMode?: string;
  furnishingStatus?: string;
  vegetarianPreference?: string;
  sharedProperty?: boolean;
  amenities?: string[];
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PropertyListResult {
  properties: Property[];
  pagination: Pagination;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private readonly api = inject(ApiService);

  getProperties(filters: PropertyFilters = {}): Observable<PropertyListResult> {
    const params: Record<string, string | number | boolean> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      // Join array values (e.g. amenities) with commas for query string serialization.
      params[key] = Array.isArray(value) ? value.join(',') : value;
    });

    return this.api.get<unknown>('/properties', params).pipe(
      map(response => this.normalizeList(response))
    );
  }

  getFeaturedProperties(): Observable<Property[]> {
    return this.api.get<unknown>('/properties/featured').pipe(
      map(response => {
        const data = this.extractData(response);

        if (Array.isArray(data)) {
          return data as Property[];
        }

        if (data && typeof data === 'object') {
          const record = data as Record<string, unknown>;
          const properties = record['properties'] ?? record['items'];

          return Array.isArray(properties) ? properties as Property[] : [];
        }

        return [];
      })
    );
  }

  getProperty(id: string): Observable<Property> {
    return this.api.get<unknown>(`/properties/${id}`).pipe(
      map(response => {
        const data = this.extractData(response);

        if (data && typeof data === 'object') {
          const record = data as Record<string, unknown>;
          return (record['property'] ?? record) as Property;
        }

        throw new Error('Property not found.');
      })
    );
  }

  getMyProperties(): Observable<Property[]> {
    return this.api.get<unknown>('/properties/mine').pipe(
      map(response => {
        const data = this.extractData(response);

        if (Array.isArray(data)) {
          return data as Property[];
        }

        if (data && typeof data === 'object') {
          const record = data as Record<string, unknown>;
          const properties = record['properties'] ?? record['items'];

          return Array.isArray(properties) ? properties as Property[] : [];
        }

        return [];
      })
    );
  }

  createProperty(payload: PropertyPayload): Observable<unknown> {
    return this.api.post('/properties', payload);
  }

  updateProperty(id: string, payload: PropertyPayload): Observable<unknown> {
    return this.api.put(`/properties/${id}`, payload);
  }

  deleteProperty(id: string): Observable<unknown> {
    return this.api.delete(`/properties/${id}`);
  }

  private normalizeList(response: unknown): PropertyListResult {
    const data = this.extractData(response);

    if (Array.isArray(data)) {
      return {
        properties: data as Property[],
        pagination: this.defaultPagination(data.length)
      };
    }

    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      const properties = record['properties'] ?? record['items'];
      const pagination = record['pagination'];

      if (Array.isArray(properties)) {
        return {
          properties: properties as Property[],
          pagination: this.normalizePagination(pagination, properties.length)
        };
      }
    }

    return {
      properties: [],
      pagination: this.defaultPagination(0)
    };
  }

  private extractData(response: unknown): unknown {
    if (!response || typeof response !== 'object') {
      return response;
    }

    // Backend may wrap the payload under a 'data' key; fall back to the raw response.
    const record = response as Record<string, unknown>;
    return record['data'] ?? response;
  }

  private normalizePagination(value: unknown, count: number): Pagination {
    if (!value || typeof value !== 'object') {
      return this.defaultPagination(count);
    }

    const record = value as Record<string, unknown>;

    // Fall back to safe defaults when the backend omits pagination fields.
    return {
      page: Number(record['page'] ?? 1),
      limit: Number(record['limit'] ?? count),
      total: Number(record['total'] ?? count),
      totalPages: Number(record['totalPages'] ?? 1)
    };
  }

  private defaultPagination(count: number): Pagination {
    return {
      page: 1,
      limit: count,
      total: count,
      totalPages: 1
    };
  }
}
