
/*
 * Handles private property inquiries and landlord notifications.
 * Provides operations for sending inquiries and managing notification status.
 */

import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { Inquiry } from '../../../core/models/models';

@Injectable({
  providedIn: 'root'
})
export class InquiryService {
  private readonly api = inject(ApiService);

  sendInquiry(propertyId: string, message: string): Observable<unknown> {
    return this.api.post(
      `/properties/${propertyId}/inquiries`,
      { message }
    );
  }

  getNotifications(): Observable<Inquiry[]> {
    return this.api.get<unknown>('/inquiries/notifications').pipe(
      map(response => this.extractList(response))
    );
  }

  getSentInquiries(): Observable<Inquiry[]> {
    return this.api.get<unknown>('/inquiries/sent').pipe(
      map(response => this.extractList(response))
    );
  }

  markAsRead(inquiryId: string): Observable<unknown> {
    return this.api.patch(`/inquiries/${inquiryId}/read`);
  }

  markAllAsRead(): Observable<unknown> {
    return this.api.patch('/inquiries/read-all');
  }

  private extractList(response: unknown): Inquiry[] {
    if (!response || typeof response !== 'object') {
      return [];
    }

    const record = response as Record<string, unknown>;
    const data = (record['data'] ?? response) as Record<string, unknown>;

    if (Array.isArray(data)) {
      return data as Inquiry[];
    }

    if (data && typeof data === 'object') {
      // Backend may return inquiries under 'inquiries' or 'notifications' key.
      const items = data['inquiries'] ?? data['notifications'];

      return Array.isArray(items) ? items as Inquiry[] : [];
    }

    return [];
  }
}
