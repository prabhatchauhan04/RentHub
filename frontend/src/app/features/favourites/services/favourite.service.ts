
/*
 * Handles adding, retrieving and removing favourite properties.
 * Connects the tenant favourites page to the backend API.
 */

import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { Property } from '../../../core/models/models';

@Injectable({
  providedIn: 'root'
})
export class FavouriteService {
  private readonly api = inject(ApiService);

  getFavourites(): Observable<Property[]> {
    return this.api.get<unknown>('/favourites').pipe(
      map(response => {
        const data = this.extractData(response);

        if (Array.isArray(data)) {
          return data.map(item => this.extractProperty(item));
        }

        if (data && typeof data === 'object') {
          const record = data as Record<string, unknown>;
          const favourites = record['favourites'] ?? record['items'];

          if (Array.isArray(favourites)) {
            return favourites.map(item => this.extractProperty(item));
          }
        }

        return [];
      })
    );
  }

  addFavourite(propertyId: string): Observable<unknown> {
    return this.api.post(`/favourites/${propertyId}`, {});
  }

  removeFavourite(propertyId: string): Observable<unknown> {
    return this.api.delete(`/favourites/${propertyId}`);
  }

  private extractData(response: unknown): unknown {
    if (!response || typeof response !== 'object') {
      return response;
    }

    const record = response as Record<string, unknown>;
    return record['data'] ?? response;
  }

  private extractProperty(item: unknown): Property {
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      // Backend may wrap the property under a 'property' key; fall back to the item itself.
      return (record['property'] ?? item) as Property;
    }

    return item as Property;
  }
}
