
/*
 * Displays properties created by the logged-in landlord.
 * Allows landlords to edit or delete their own property listings.
 */

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Property } from '../../../../core/models/models';
import { PropertyService } from '../../services/property.service';
import { PropertyCardComponent } from '../../../../shared/components/property-card/property-card.component';

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [RouterLink, PropertyCardComponent],
  templateUrl: './my-properties.component.html',
  styleUrl: './my-properties.component.css'
})
export class MyPropertiesComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly cdr = inject(ChangeDetectorRef);

  properties: Property[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.propertyService.getMyProperties().subscribe({
      next: properties => {
        this.properties = properties;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorMessage =
          error.error?.message || 'Unable to load your properties.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteProperty(property: Property): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${property.propertyName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.propertyService.deleteProperty(property.id).subscribe({
      next: () => {
        this.properties = this.properties.filter(
          item => item.id !== property.id
        );
        this.cdr.markForCheck();
      },
      error: error => {
        this.errorMessage =
          error.error?.message || 'Unable to delete this property.';
        this.cdr.markForCheck();
      }
    });
  }
}
