
/*
 * Handles public property comments and replies.
 * Connects the comments feature to the backend comment endpoints.
 */

import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { CommentItem } from '../../../core/models/models';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private readonly api = inject(ApiService);

  getComments(propertyId: string): Observable<CommentItem[]> {
    return this.api.get<unknown>(
      `/properties/${propertyId}/comments`
    ).pipe(
      map(response => {
        const data = this.extractData(response);

        if (Array.isArray(data)) {
          return data as CommentItem[];
        }

        // Backend may wrap comments under a 'comments' key instead of returning a bare array.
        if (data && typeof data === 'object') {
          const record = data as Record<string, unknown>;
          const comments = record['comments'];

          return Array.isArray(comments) ? comments as CommentItem[] : [];
        }

        return [];
      })
    );
  }

  addComment(propertyId: string, content: string): Observable<unknown> {
    return this.api.post(
      `/properties/${propertyId}/comments`,
      { content }
    );
  }

  addReply(
    propertyId: string,
    commentId: string,
    content: string
  ): Observable<unknown> {
    return this.api.post(
      `/properties/${propertyId}/comments/${commentId}/replies`,
      { content }
    );
  }

  deleteComment(commentId: string): Observable<unknown> {
    return this.api.delete(`/comments/${commentId}`);
  }

  private extractData(response: unknown): unknown {
    if (!response || typeof response !== 'object') {
      return response;
    }

    // Backend may wrap the payload under a 'data' key; fall back to the raw response.
    const record = response as Record<string, unknown>;
    return record['data'] ?? response;
  }
}
