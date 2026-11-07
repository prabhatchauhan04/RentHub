
/*
 * Handles creating and editing RentHub property listings.
 * Supports form validation, image uploads and a final preview before submission.
 */

import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import {
  Property,
  PropertyImage,
  PropertyPayload,
  PropertyType,
  LeaseType,
  PriceMode,
  FurnishingStatus,
  VegetarianPreference
} from '../../../../core/models/models';

import { PropertyService } from '../../services/property.service';
import { CloudinaryService } from '../../services/cloudinary.service';

@Component({
  selector: 'app-create-property',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './create-property.component.html',
  styleUrl: './create-property.component.css'
})
export class CreatePropertyComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);
  private readonly cloudinaryService = inject(CloudinaryService);
  private readonly cdr = inject(ChangeDetectorRef);

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

  propertyId: string | null = null;
  isEditMode = false;
  showPreview = false;
  isLoading = false;
  isUploading = false;
  errorMessage = '';
  imageErrorMessage = '';
  // Auto-clears image validation messages after 5 seconds.
  private imageErrorTimeout: ReturnType<typeof setTimeout> | null = null;
  // Auto-clears general error messages after 5 seconds.
  private errorTimeout: ReturnType<typeof setTimeout> | null = null;

  selectedFiles: File[] = [];
  images: PropertyImage[] = [];

  form = {
    propertyType: 'APARTMENT' as PropertyType,
    propertyName: '',
    sharedProperty: false,
    address: '',
    area: '',
    city: '',
    state: '',
    postalCode: '',
    squareFeet: 0,
    leaseType: 'LONG_TERM' as LeaseType,
    monthlyRent: 0,
    isNegotiable: false,
    priceMode: 'PER_MONTH' as PriceMode,
    furnishingStatus: 'UNFURNISHED' as FurnishingStatus,
    vegetarianPreference: 'NO_PREFERENCE' as VegetarianPreference,
    contactPhone: '',
    title: '',
    description: '',
    amenities: [] as string[]
  };

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.propertyId;

    if (this.propertyId) {
      this.loadProperty(this.propertyId);
    }
  }

  loadProperty(id: string): void {
    this.isLoading = true;

    this.propertyService.getProperty(id).subscribe({
      next: property => {
        this.populateForm(property);
        this.isLoading = false;
        // Zoneless change detection requires manual markForCheck after async updates.
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Unable to load this property.';
        this.cdr.markForCheck();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.clearErrorTimeout();
        this.errorTimeout = setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 5000);
      }
    });
  }

  private populateForm(property: Property): void {
    this.form = {
      propertyType: property.propertyType,
      propertyName: property.propertyName,
      sharedProperty: property.sharedProperty,
      address: property.address,
      area: property.area,
      city: property.city,
      state: property.state,
      postalCode: property.postalCode,
      squareFeet: property.squareFeet,
      leaseType: property.leaseType,
      // Backend may return rent as string or number; coerce to number for the form.
      monthlyRent: Number(property.monthlyRent),
      isNegotiable: property.isNegotiable,
      priceMode: property.priceMode,
      furnishingStatus: property.furnishingStatus,
      vegetarianPreference: property.vegetarianPreference,
      contactPhone: property.contactPhone ?? '',
      title: property.title,
      description: property.description,
      amenities: (property.amenities ?? [])
        .map((item: any) => {
          const name = (typeof item === 'string' ? item : item.name || item.amenity?.name || '').trim();
          if (!name) {
            return '';
          }
          const match = this.amenitiesList.find(
            a => a.toLowerCase() === name.toLowerCase()
          );
          return match || name;
        })
        .filter(Boolean)
    };

    this.images = [...(property.images ?? [])];
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    this.errorMessage = '';
    this.imageErrorMessage = '';
    if (this.imageErrorTimeout) {
      clearTimeout(this.imageErrorTimeout);
      this.imageErrorTimeout = null;
    }

    const validFiles = files.filter(file => {
      if (file.type.startsWith('image/') === false) {
        this.imageErrorMessage = 'Only image files are allowed.';
        return false;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.imageErrorMessage = 'Each image must be smaller than 5 MB.';
        return false;
      }

      return true;
    });

    const remainingSlots = 8 - this.images.length - this.selectedFiles.length;

    if (validFiles.length > remainingSlots) {
      this.imageErrorMessage = 'You can upload a maximum of 8 images.';
      this.cdr.markForCheck();
      this.imageErrorTimeout = setTimeout(() => {
        this.imageErrorMessage = '';
        this.cdr.markForCheck();
      }, 5000);
    }

    const newFiles = validFiles.slice(0, remainingSlots);
    this.selectedFiles = [...this.selectedFiles, ...newFiles];
    input.value = '';
  }

  async uploadImages(): Promise<void> {
    if (this.selectedFiles.length === 0 || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.imageErrorMessage = '';
    if (this.imageErrorTimeout) {
      clearTimeout(this.imageErrorTimeout);
      this.imageErrorTimeout = null;
    }

    try {
      for (const file of this.selectedFiles) {
        const uploadedImage = await firstValueFrom(
          this.cloudinaryService.uploadImage(file)
        );

        this.images.push({
          ...uploadedImage,
          position: this.images.length
        });
      }

      this.selectedFiles = [];
    } catch (error) {
      this.imageErrorMessage =
        error instanceof Error
          ? error.message
          : 'Image upload failed. Please try again.';
      this.imageErrorTimeout = setTimeout(() => {
        this.imageErrorMessage = '';
        this.cdr.markForCheck();
      }, 5000);
    } finally {
      this.isUploading = false;
      this.cdr.markForCheck();
    }
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    // Reassign to trigger change detection on the array reference.
    this.selectedFiles = [...this.selectedFiles];
  }

  private clearErrorTimeout(): void {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
  }

  removeImage(index: number): void {
    this.images.splice(index, 1);
    // Re-index positions so they remain sequential after removal.
    this.images = this.images.map((image, position) => ({
      ...image,
      position
    }));
  }

  toggleAmenity(amenity: string, checked: boolean): void {
    const lower = amenity.toLowerCase();
    if (checked && !this.form.amenities.some(item => item.toLowerCase() === lower)) {
      this.form.amenities.push(amenity);
    } else if (!checked) {
      this.form.amenities = this.form.amenities.filter(
        item => item.toLowerCase() !== lower
      );
    }
  }

  isAmenitySelected(amenity: string): boolean {
    return this.form.amenities.some(
      item => item.toLowerCase() === amenity.toLowerCase()
    );
  }

  openPreview(form?: any): void {
    this.errorMessage = '';
    this.imageErrorMessage = '';
    this.clearErrorTimeout();

    if (form?.invalid) {
      this.errorMessage = 'Please fill in all required fields.';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }    if (this.selectedFiles.length > 0) {
      this.imageErrorMessage = 'Please upload your selected images before previewing.';
      return;
    }

    if (this.images.length === 0) {
      this.imageErrorMessage = 'Please upload at least one property image.';
      return;
    }

    if (this.form.description.length > 1400) {
      this.errorMessage = 'Description cannot exceed 1400 characters.';
      return;
    }

    this.showPreview = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editForm(): void {
    this.showPreview = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async submitProperty(): Promise<void> {
    if (this.isLoading || this.isUploading) {
      return;
    }

    const payload: PropertyPayload = {
      ...this.form,
      // Trim whitespace; send null instead of empty string for optional phone.
      contactPhone: this.form.contactPhone.trim() || null,
      monthlyRent: Number(this.form.monthlyRent),
      squareFeet: Number(this.form.squareFeet),
      amenities: [...this.form.amenities],
      images: this.images.map((image, position) => ({
        imageUrl: image.imageUrl,
        publicId: image.publicId,
        position
      }))
    };

    this.isLoading = true;
    this.errorMessage = '';

    const request = this.propertyId
      ? this.propertyService.updateProperty(this.propertyId, payload)
      : this.propertyService.createProperty(payload);

    request.subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/properties/mine']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Unable to save the property.';
        this.showPreview = false;
        this.cdr.markForCheck();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.clearErrorTimeout();
        this.errorTimeout = setTimeout(() => {
          this.errorMessage = '';
          this.cdr.markForCheck();
        }, 5000);
      }
    });
  }

  cancel(): void {
    this.router.navigate(
      this.isEditMode ? ['/properties/mine'] : ['/']
    );
  }
}
