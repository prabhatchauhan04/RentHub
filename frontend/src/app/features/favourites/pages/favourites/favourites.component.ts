
/*
 * Displays the properties saved by the logged-in tenant.
 * Allows tenants to remove properties from their favourites.
 */

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Property } from '../../../../core/models/models';
import { FavouriteService } from '../../services/favourite.service';
import { PropertyCardComponent } from '../../../../shared/components/property-card/property-card.component';

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [PropertyCardComponent, RouterLink],
  templateUrl: './favourites.component.html',
  styleUrl: './favourites.component.css'
})
export class FavouritesComponent implements OnInit {
  private readonly favouriteService = inject(FavouriteService);
  private readonly cdr = inject(ChangeDetectorRef);

  properties: Property[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadFavourites();
  }

  loadFavourites(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.favouriteService.getFavourites().subscribe({
      next: properties => {
        this.properties = properties;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorMessage =
          error.error?.message || 'Unable to load your favourites.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  removeFavourite(propertyId: string): void {
    this.favouriteService.removeFavourite(propertyId).subscribe({
      next: () => {
        this.properties = this.properties.filter(
          property => property.id !== propertyId
        );
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorMessage =
          error.error?.message || 'Unable to remove this favourite.';
        this.cdr.markForCheck();
      }
    });
  }
}
