
/*
 * Displays complete information about a rental property.
 * Supports public comments, replies and private inquiries to the landlord.
 */

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { Property, CommentItem, DEFAULT_PROPERTY_PLACEHOLDER } from '../../../../core/models/models';
import { AuthService } from '../../../../services/auth.service';
import { PropertyService } from '../../services/property.service';
import { CommentService } from '../../../comments/services/comment.service';
import { InquiryService } from '../../../inquiries/services/inquiry.service';
import { FavouriteService } from '../../../favourites/services/favourite.service';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './property-details.component.html',
  styleUrl: './property-details.component.css'
})
export class PropertyDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly propertyService = inject(PropertyService);
  private readonly commentService = inject(CommentService);
  private readonly inquiryService = inject(InquiryService);
  private readonly favouriteService = inject(FavouriteService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly authService = inject(AuthService);
  readonly defaultPlaceholder = DEFAULT_PROPERTY_PLACEHOLDER;

  property: Property | null = null;
  comments: CommentItem[] = [];

  selectedImage = '';
  newComment = '';
  inquiryMessage = '';
  replyContent: Record<string, string> = {};

  isLoading = true;
  isSendingComment = false;
  // Guards against double-delete when the delete button is clicked rapidly.
  isDeletingComment = false;
  isSendingInquiry = false;
  isFavourite = false;
  errorMessage = '';
  commentError = '';
  successMessage = '';
  private successTimeout: ReturnType<typeof setTimeout> | null = null;
  private errorTimeout: ReturnType<typeof setTimeout> | null = null;
  // Suppresses the "Message must be at least 5 characters" flash right after a successful send.
  private justSentInquiry = false;

  ngOnInit(): void {
    const propertyId = this.route.snapshot.paramMap.get('id');

    if (!propertyId) {
      this.isLoading = false;
      this.errorMessage = 'Property not found.';
      return;
    }

    this.loadProperty(propertyId);
    this.loadComments(propertyId);
    this.checkIfFavourite(propertyId);
  }

  checkIfFavourite(propertyId: string): void {
    // Only tenants can favourite properties; landlords skip this check entirely.
    if (this.authService.currentUser?.role === 'TENANT') {
      this.favouriteService.getFavourites().subscribe({
        next: (favourites) => {
          this.isFavourite = favourites.some((f) => f.id === propertyId);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isFavourite = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  toggleFavourite(): void {
    if (!this.propertyId || !this.isTenant) return;

    if (this.isFavourite) {
      this.favouriteService.removeFavourite(this.propertyId).subscribe({
        next: () => {
          this.isFavourite = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.favouriteService.addFavourite(this.propertyId).subscribe({
        next: () => {
          this.isFavourite = true;
          this.cdr.markForCheck();
        }
      });
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Only replace if not already showing the placeholder (avoids infinite loop).
    if (img && img.src !== this.defaultPlaceholder) {
      img.src = this.defaultPlaceholder;
    }
  }

  get propertyId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  get isOwner(): boolean {
    return !!(
      this.property?.ownerId &&
      this.authService.currentUser?.id === this.property.ownerId
    );
  }

  get isTenant(): boolean {
    return this.authService.currentUser?.role === 'TENANT';
  }

  get amenityNames(): string[] {
    // Amenities may arrive as plain strings or objects with name/amenity.name.
    return (this.property?.amenities ?? [])
      .map((item: any) => (typeof item === 'string' ? item : item.name || item.amenity?.name || ''))
      .filter(Boolean);
  }

  loadProperty(id: string): void {
    this.isLoading = true;

    this.propertyService.getProperty(id).subscribe({
      next: property => {
        this.property = property;
        this.selectedImage =
          property.images?.[0]?.imageUrl ||
          this.defaultPlaceholder;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Unable to load this property.';
        this.cdr.markForCheck();
      }
    });
  }

  loadComments(id: string): void {
    this.commentService.getComments(id).subscribe({
      next: comments => {
        this.comments = comments;
        this.cdr.markForCheck();
      },
      error: () => {
        this.comments = [];
        this.cdr.markForCheck();
      }
    });
  }

  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  addComment(): void {
    const content = this.newComment.trim();

    if (!content || !this.propertyId || this.isSendingComment) {
      return;
    }

    this.isSendingComment = true;
    this.errorMessage = '';

    this.commentService.addComment(this.propertyId, content).subscribe({
      next: () => {
        this.newComment = '';
        this.isSendingComment = false;
        this.cdr.markForCheck();
        this.loadComments(this.propertyId);
      },
      error: (error: HttpErrorResponse) => {
        this.isSendingComment = false;
        this.cdr.markForCheck();
        this.errorMessage =
          error.error?.message || 'Unable to post your comment.';
      }
    });
  }

  addReply(commentId: string): void {
    const content = (this.replyContent[commentId] ?? '').trim();

    if (!content || this.isSendingComment) {
      return;
    }

    this.isSendingComment = true;
    this.errorMessage = '';

    this.commentService.addReply(
      this.propertyId,
      commentId,
      content
    ).subscribe({
      next: () => {
        this.replyContent[commentId] = '';
        this.isSendingComment = false;
        this.cdr.markForCheck();
        this.loadComments(this.propertyId);
      },
      error: (error: HttpErrorResponse) => {
        this.isSendingComment = false;
        this.errorMessage =
          error.error?.message || 'Unable to post your reply.';
      }
    });
  }

  deleteComment(commentId: string): void {
    if (this.isDeletingComment) {
      return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    this.isDeletingComment = true;
    this.commentError = '';

    this.commentService.deleteComment(commentId).subscribe({
      next: () => this.loadComments(this.propertyId),
      error: (error: HttpErrorResponse) => {
        this.commentError =
          error.error?.message || 'Unable to delete this comment.';
        this.isDeletingComment = false;
        this.cdr.markForCheck();
      },
      complete: () => {
        this.isDeletingComment = false;
      }
    });
  }

  private clearSuccessTimeout(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
      this.successTimeout = null;
    }
  }

  private clearErrorTimeout(): void {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
  }

  sendInquiry(): void {
    const message = this.inquiryMessage.trim();

    if (message.length < 5 || !this.propertyId || this.isSendingInquiry) {
      return;
    }

    this.isSendingInquiry = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.clearSuccessTimeout();
    this.clearErrorTimeout();

    this.inquiryService.sendInquiry(this.propertyId, message).subscribe({
      next: () => {
        this.inquiryMessage = '';
        this.isSendingInquiry = false;
        this.errorMessage = '';
        this.successMessage = 'Your inquiry has been sent to the landlord.';
        this.cdr.markForCheck();
        this.justSentInquiry = true;
        this.clearSuccessTimeout();
        this.successTimeout = setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 5000);
      },
      error: (error: HttpErrorResponse) => {
        this.isSendingInquiry = false;
        this.successMessage = '';
        this.clearErrorTimeout();
        this.errorMessage =
          error.error?.message || 'Unable to send your inquiry.';
        this.cdr.markForCheck();
        this.errorTimeout = setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 5000);
      }
    });
  }
}
