
/*
 * Provides a centralized interface for frontend API requests.
 * Supports HTTP operations, query parameters, and environment-based API URLs.
 */

import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');

  get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Observable<T> {
    let httpParams = new HttpParams();

    if (params) {
      // Skip null, undefined, or empty values so they are not sent as query params.
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.http.get<T>(this.buildUrl(endpoint), {
      params: httpParams
    });
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body);
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), body);
  }

  patch<T>(endpoint: string, body: unknown = {}): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint), body);
  }

  delete<T = unknown>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint));
  }

  private buildUrl(endpoint: string): string {
    // Strip leading slashes so endpoints like '/properties' and 'properties' both resolve correctly.
    const path = endpoint.replace(/^\/+/, '');
    return `${this.baseUrl}/${path}`;
  }
}
