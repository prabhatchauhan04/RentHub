
/*
 * Displays private inquiries received by a landlord.
 * Landlords can mark individual notifications or all notifications as read.
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Inquiry } from '../../../../core/models/models';
import { InquiryService } from '../../services/inquiry.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
  notifications: Inquiry[] = [];
  isLoading = true;
  errorMessage = '';
  isMarkingAll = false;

  constructor(
    private inquiryService: InquiryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.inquiryService.getNotifications().subscribe({
      next: (notifications) => {
        // Sort newest first by comparing creation timestamps.
        this.notifications = [...notifications].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load notifications. Please try again.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  markAsRead(notification: Inquiry): void {
    if (notification.isRead) return;

    this.inquiryService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to update this notification.';
        this.cdr.markForCheck();
      }
    });
  }

  markAllAsRead(): void {
    // Prevent double-submission while a mark-all request is already in flight.
    if (this.isMarkingAll || !this.hasUnreadNotifications) return;

    this.isMarkingAll = true;

    this.inquiryService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) => ({
          ...notification,
          isRead: true
        }));
        this.isMarkingAll = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to mark all notifications as read.';
        this.isMarkingAll = false;
        this.cdr.markForCheck();
      }
    });
  }

  get hasUnreadNotifications(): boolean {
    return this.notifications.some((notification) => !notification.isRead);
  }
}
