
/*
 * Displays a reusable summary of an apartment listing.
 * Supports property details navigation and favourite actions.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Property, DEFAULT_PROPERTY_PLACEHOLDER } from '../../../core/models/models';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.css'
})
export class PropertyCardComponent {
  @Input({ required: true }) property!: Property;
  @Input() isFavourite = false;
  @Input() showFavouriteButton = true;

  @Output() favouriteToggle = new EventEmitter<string>();

  get imageUrl(): string {
    return this.property.images?.[0]?.imageUrl || DEFAULT_PROPERTY_PLACEHOLDER;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Only replace if not already showing the placeholder (avoids infinite reload loop).
    if (img && img.src !== DEFAULT_PROPERTY_PLACEHOLDER) {
      img.src = DEFAULT_PROPERTY_PLACEHOLDER;
    }
  }

  get amenityNames(): string[] {
    // Amenities may arrive as plain strings or objects with name/amenity.name; show max 3.
    return (this.property.amenities || [])
      .map((item: any) => (typeof item === 'string' ? item : item.name || item.amenity?.name || ''))
      .filter(Boolean)
      .slice(0, 2);
  }

  toggleFavourite(): void {
    this.favouriteToggle.emit(this.property.id);
  }
}
