
/*
 * Displays inquiries sent by the logged-in tenant.
 * Shows the associated property and the inquiry's read status.
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Inquiry } from '../../../../core/models/models';
import { InquiryService } from '../../services/inquiry.service';

@Component({
  selector: 'app-sent-inquiries',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './sent-inquiries.component.html',
  styleUrl: './sent-inquiries.component.css'
})
export class SentInquiriesComponent implements OnInit {
  inquiries: Inquiry[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private inquiryService: InquiryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInquiries();
  }

  loadInquiries(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.inquiryService.getSentInquiries().subscribe({
      next: (inquiries) => {
        // Sort newest first by comparing creation timestamps.
        this.inquiries = [...inquiries].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load your inquiries. Please try again.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
