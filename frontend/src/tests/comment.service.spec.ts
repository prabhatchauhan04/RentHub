/*
 * Unit tests for CommentService.
 * Covers comment retrieval, creation, replies, and deletion with mocked ApiService.
 */

import { TestBed } from '@angular/core/testing';
import { CommentService } from '../app/features/comments/services/comment.service';
import { ApiService } from '../app/services/api.service';
import { of, throwError } from 'rxjs';

const mockComments = [
  {
    id: 'c1',
    content: 'Great property!',
    createdAt: '2024-01-01T00:00:00Z',
    user: { id: 'u1', name: 'Alice' },
  },
  {
    id: 'c2',
    content: 'Very nice place.',
    createdAt: '2024-01-02T00:00:00Z',
    user: { id: 'u2', name: 'Bob' },
    replies: [
      {
        id: 'r1',
        content: 'Thanks!',
        createdAt: '2024-01-03T00:00:00Z',
        user: { id: 'u1', name: 'Alice' },
      },
    ],
  },
];

describe('CommentService', () => {
  let service: CommentService;
  let mockApiService: any;

  beforeEach(() => {
    mockApiService = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: mockApiService }],
    });

    service = TestBed.inject(CommentService);
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('getComments should return comments array when API returns an array', () => {
    mockApiService.get.mockReturnValue(of(mockComments));

    service.getComments('prop-1').subscribe((comments) => {
      expect(comments.length).toBe(2);
      expect(comments[0].id).toBe('c1');
    });
  });

  it('getComments should extract comments from data.comments when API returns an object', () => {
    mockApiService.get.mockReturnValue(of({ data: { comments: mockComments } }));

    service.getComments('prop-1').subscribe((comments) => {
      expect(comments.length).toBe(2);
      expect(comments[1].replies?.length).toBe(1);
    });
  });

  it('getComments should return empty array when API returns null', () => {
    mockApiService.get.mockReturnValue(of(null));

    service.getComments('prop-1').subscribe((comments) => {
      expect(comments).toEqual([]);
    });
  });

  it('getComments should return empty array when API returns object without comments', () => {
    mockApiService.get.mockReturnValue(of({ data: { other: 'value' } }));

    service.getComments('prop-1').subscribe((comments) => {
      expect(comments).toEqual([]);
    });
  });

  it('addComment should call api.post with correct endpoint and payload', () => {
    mockApiService.post.mockReturnValue(of({ success: true }));

    service.addComment('prop-1', 'Nice place!').subscribe();

    expect(mockApiService.post).toHaveBeenCalledWith(
      '/properties/prop-1/comments',
      { content: 'Nice place!' }
    );
  });

  it('addReply should call api.post with correct endpoint and payload', () => {
    mockApiService.post.mockReturnValue(of({ success: true }));

    service.addReply('prop-1', 'c1', 'Thanks for the info!').subscribe();

    expect(mockApiService.post).toHaveBeenCalledWith(
      '/properties/prop-1/comments/c1/replies',
      { content: 'Thanks for the info!' }
    );
  });

  it('deleteComment should call api.delete with comment ID', () => {
    mockApiService.delete.mockReturnValue(of({ success: true }));

    service.deleteComment('c1').subscribe();

    expect(mockApiService.delete).toHaveBeenCalledWith('/comments/c1');
  });

  it('addComment should propagate error from API', () => {
    mockApiService.post.mockReturnValue(throwError(() => new Error('Server error')));

    service.addComment('prop-1', 'test').subscribe({
      error: (err) => {
        expect(err.message).toBe('Server error');
      },
    });
  });

  it('deleteComment should propagate error from API', () => {
    mockApiService.delete.mockReturnValue(throwError(() => new Error('Not found')));

    service.deleteComment('c1').subscribe({
      error: (err) => {
        expect(err.message).toBe('Not found');
      },
    });
  });
});
