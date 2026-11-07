
/*
 * Displays featured properties and the main property listing page.
 * Supports searching, filtering, sorting and paginated results.
 */

import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Property, Pagination, DEFAULT_PROPERTY_PLACEHOLDER } from '../../../../core/models/models';
import { PropertyService } from '../../services/property.service';
import { PropertyFilters } from '../../services/property.service';
import { FavouriteService } from '../../../favourites/services/favourite.service';
import { AuthService } from '../../../../services/auth.service';
import { PropertyCardComponent } from '../../../../shared/components/property-card/property-card.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, PropertyCardComponent, PaginationComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly propertyService = inject(PropertyService);
  private readonly favouriteService = inject(FavouriteService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Default image placeholder for carousel property slides */
  readonly defaultPlaceholder = DEFAULT_PROPERTY_PLACEHOLDER;

  featuredProperties: Property[] = [];
  properties: Property[] = [];
  favouriteIds = new Set<string>();

  /** Hero carousel state: 0 = hero text slide, 1+ = featuredProperties[index-1] */
  carouselIndex = 0;
  private carouselInterval: ReturnType<typeof setInterval> | null = null;

  /** Returns all carousel items: first item is null (hero slide), rest are featured properties */
  get carouselItems(): (Property | null)[] {
    return [null, ...this.featuredProperties];
  }

  search = '';
  city = '';
  sort = 'newest';
  minRent: number | null = null;
  maxRent: number | null = null;
  propertyType: '' | 'APARTMENT' | 'BUILDING' = '';
  furnishingStatus: '' | 'FURNISHED' | 'UNFURNISHED' = '';
  amenities: string[] = [];

  readonly propertyTypeOptions = [
    { value: '', label: 'All' },
    { value: 'APARTMENT', label: 'Apartment' },
    { value: 'BUILDING', label: 'Building' }
  ];

  readonly furnishingOptions = [
    { value: '', label: 'All' },
    { value: 'FURNISHED', label: 'Yes' },
    { value: 'UNFURNISHED', label: 'No' }
  ];

  readonly amenitiesList = [
    'Gym/Fitness Center',
    'Swimming Pool',
    'Car Park',
    'Visitors Parking',
    'Power Backup',
    'Garbage Disposal',
    'Private Lawn',
    'Water Heater',
    'Plant Security System',
    'Laundry Service',
    'Elevator',
    'Club House'
  ];

  currentPage = 1;
  readonly pageSize = 9;

  pagination: Pagination = {
    page: 1,
    limit: this.pageSize,
    total: 0,
    totalPages: 1
  };

  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadFeaturedProperties();
    this.loadProperties();
    this.loadTenantFavourites();
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  /** Starts the auto-advance interval (5 seconds per slide). */
  startCarousel(): void {
    this.stopCarousel();
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  /** Clears the auto-advance interval. */
  stopCarousel(): void {
    if (this.carouselInterval !== null) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  /** Advances carousel to next slide (wraps around). */
  nextSlide(): void {
    this.carouselIndex = (this.carouselIndex + 1) % this.carouselItems.length;
    this.cdr.markForCheck();
  }

  /** Goes back to previous slide (wraps around). */
  prevSlide(): void {
    this.carouselIndex =
      (this.carouselIndex - 1 + this.carouselItems.length) % this.carouselItems.length;
    this.cdr.markForCheck();
  }

  /** Jumps to a specific carousel slide index and resets the auto-advance timer. */
  goToSlide(index: number): void {
    this.carouselIndex = index;
    this.cdr.markForCheck();
    this.startCarousel();
  }

  /** Falls back to the placeholder when a carousel image fails to load. */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Only replace if not already showing the placeholder (avoids infinite loop).
    if (img && img.src !== this.defaultPlaceholder) {
      img.src = this.defaultPlaceholder;
    }
  }

  /** Formats a rent value as Indian Rupees (e.g. ₹25,000). */
  formatRent(value: number | string): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
  }

  loadTenantFavourites(): void {
    if (this.authService.currentUser?.role === 'TENANT') {
      this.favouriteService.getFavourites().subscribe({
        next: favourites => {
          this.favouriteIds = new Set(favourites.map(f => f.id));
          this.cdr.markForCheck();
        },
        error: () => {
          this.favouriteIds.clear();
          this.cdr.markForCheck();
        }
      });
    } else {
      // Landlords have no favourites; ensure the set is cleared.
      this.favouriteIds.clear();
      this.cdr.markForCheck();
    }
  }

  isFavourite(propertyId: string): boolean {
    return this.favouriteIds.has(propertyId);
  }

  amenityNames(property: Property): string[] {
    return (property.amenities || [])
      .map((item: any) => (typeof item === 'string' ? item : item.name || item.amenity?.name || ''))
      .filter(Boolean)
      .slice(0, 8);
  }

  toggleFavourite(propertyId: string): void {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    // Only tenants can mark favourites; landlords are ignored.
    if (this.authService.currentUser?.role !== 'TENANT') {
      return;
    }

    const wasFavourite = this.favouriteIds.has(propertyId);

    // Optimistic update: toggle immediately so the UI stays in sync.
    if (wasFavourite) {
      this.favouriteIds.delete(propertyId);
    } else {
      this.favouriteIds.add(propertyId);
    }
    this.cdr.markForCheck();

    const request = wasFavourite
      ? this.favouriteService.removeFavourite(propertyId)
      : this.favouriteService.addFavourite(propertyId);

    request.subscribe({
      next: () => {
        // Server confirmed; state already updated optimistically.
      },
      error: () => {
        // Revert on failure to keep UI in sync with actual state.
        if (wasFavourite) {
          this.favouriteIds.add(propertyId);
        } else {
          this.favouriteIds.delete(propertyId);
        }
        this.cdr.markForCheck();
      }
    });
  }

  toggleAmenity(amenity: string, checked: boolean): void {
    if (checked && !this.amenities.includes(amenity)) {
      this.amenities.push(amenity);
    } else if (!checked) {
      this.amenities = this.amenities.filter(item => item !== amenity);
    }
  }

  isAmenitySelected(amenity: string): boolean {
    return this.amenities.includes(amenity);
  }

  loadFeaturedProperties(): void {
    this.propertyService.getFeaturedProperties().subscribe({
      next: properties => {
        this.featuredProperties = properties;
        /* Reset carousel to hero slide so newly loaded properties start from the beginning */
        this.carouselIndex = 0;
        this.cdr.markForCheck();
      },
      error: () => {
        this.featuredProperties = [];
        this.cdr.markForCheck();
      }
    });
  }

  loadProperties(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const filters: PropertyFilters = {
      search: this.search.trim() || undefined,
      city: this.city.trim() || undefined,
      sort: this.sort,
      minRent: this.minRent ?? undefined,
      maxRent: this.maxRent ?? undefined,
      propertyType: this.propertyType || undefined,
      furnishingStatus: this.furnishingStatus || undefined,
      amenities: this.amenities.length ? this.amenities : undefined,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.propertyService.getProperties(filters).subscribe({
      next: result => {
        this.properties = result.properties;
        this.pagination = result.pagination;
        this.currentPage = result.pagination.page;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Unable to load properties. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadProperties();
  }

  clearFilters(): void {
    this.search = '';
    this.city = '';
    this.sort = 'newest';
    this.minRent = null;
    this.maxRent = null;
    this.propertyType = '';
    this.furnishingStatus = '';
    this.amenities = [];
    this.currentPage = 1;
    this.loadProperties();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadProperties();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
