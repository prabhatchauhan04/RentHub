
/*
 * Provides reusable pagination controls for listing pages.
 * Emits the selected page number to the parent component.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;

  @Output() pageChange = new EventEmitter<number>();

  get pages(): number[] {
    // Show a window of up to 5 page numbers centered on the current page.
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, index) => start + index
    );
  }

  goToPage(page: number): void {
    // Ignore clicks on out-of-range pages or the currently active page.
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.pageChange.emit(page);
  }
}
