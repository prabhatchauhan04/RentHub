/*
 * Unit tests for PropertyCardComponent.
 * Covers input bindings, image fallback, amenity listing, and favourite toggle.
 */

import { inject, Injector, runInInjectionContext } from '@angular/core';
import { PropertyCardComponent } from '../app/shared/components/property-card/property-card.component';
import { Property, DEFAULT_PROPERTY_PLACEHOLDER } from '../app/core/models/models';

const mockProperty: Property = {
  id: 'prop-1',
  propertyType: 'APARTMENT',
  propertyName: 'Sunset Apartments',
  sharedProperty: false,
  address: '123 Main St',
  area: 'Downtown',
  city: 'Mumbai',
  state: 'MH',
  postalCode: '400001',
  squareFeet: 800,
  leaseType: 'LONG_TERM',
  monthlyRent: 25000,
  isNegotiable: true,
  priceMode: 'PER_MONTH',
  furnishingStatus: 'FURNISHED',
  vegetarianPreference: 'NO_PREFERENCE',
  contactPhone: '9876543210',
  title: 'Beautiful 2BHK apartment',
  description: 'A lovely apartment in the city center.',
  status: 'ACTIVE',
  ownerId: 'owner-1',
  images: [
    { imageUrl: 'https://example.com/img1.jpg', publicId: 'img1', position: 0 },
  ],
  amenities: [
    { id: 'a1', name: 'Gym', amenity: { id: 'a1', name: 'Gym' } },
    { id: 'a2', name: 'Pool', amenity: { id: 'a2', name: 'Pool' } },
    { id: 'a3', name: 'Parking', amenity: { id: 'a3', name: 'Parking' } },
    { id: 'a4', name: 'Garden', amenity: { id: 'a4', name: 'Garden' } },
  ],
  createdAt: '2024-01-01T00:00:00Z',
};

describe('PropertyCardComponent', () => {
  let injector: Injector;

  beforeEach(() => {
    injector = Injector.create({ providers: [] });
  });

  it('should create the component', () => {
    const component = runInInjectionContext(injector, () => {
      return new PropertyCardComponent();
    });
    expect(component).toBeTruthy();
  });

  it('should bind property input correctly', () => {
    const component = runInInjectionContext(injector, () => {
      return new PropertyCardComponent();
    });
    component.property = mockProperty;
    expect(component.property).toBe(mockProperty);
    expect(component.property.propertyName).toBe('Sunset Apartments');
  });

  it('should return first image URL from imageUrl getter', () => {
    const component = runInInjectionContext(injector, () => {
      return new PropertyCardComponent();
    });
    component.property = mockProperty;
    expect(component.imageUrl).toBe('https://example.com/img1.jpg');
  });

  it('should return DEFAULT_PROPERTY_PLACEHOLDER when no images exist', () => {
    const component = runInInjectionContext(injector, () => {
      return new PropertyCardComponent();
    });
    component.property = { ...mockProperty, images: [] };
    expect(component.imageUrl).toBe(DEFAULT_PROPERTY_PLACEHOLDER);
  });

  it('should return up to 3 amenity names from amenityNames getter', () => {
    const component = runInInjectionContext(injector, () => {
      return new PropertyCardComponent();
    });
    component.property = mockProperty;
    const names = component.amenityNames;
    expect(names.length).toBe(2);
    expect(names).toContain('Gym');
    expect(names).toContain('Pool');
    expect(names).not.toContain('Garden');
  });

  it('should return empty array when no amenities exist', () => {
    const component = runInInjectionContext(injector, () => {
      return new PropertyCardComponent();
    });
    component.property = { ...mockProperty, amenities: [] };
    expect(component.amenityNames).toEqual([]);
  });

  it('should emit property id on toggleFavourite', () => {
    const component = runInInjectionContext(injector, () => {
      return new PropertyCardComponent();
    });
    component.property = mockProperty;
    const emitSpy = vi.spyOn(component.favouriteToggle, 'emit');
    component.toggleFavourite();
    expect(emitSpy).toHaveBeenCalledWith('prop-1');
  });

  it('should handle image error by replacing source with placeholder', () => {
    const component = runInInjectionContext(injector, () => {
      return new PropertyCardComponent();
    });
    component.property = mockProperty;

    const fakeEvent = {
      target: {
        src: 'https://example.com/broken.jpg',
      },
    } as unknown as Event;

    component.onImageError(fakeEvent);
    expect((fakeEvent.target as HTMLImageElement).src).toBe(
      DEFAULT_PROPERTY_PLACEHOLDER
    );
  });

  it('should not replace source if it is already the placeholder', () => {
    const component = runInInjectionContext(injector, () => {
      return new PropertyCardComponent();
    });
    component.property = mockProperty;

    const fakeEvent = {
      target: {
        src: DEFAULT_PROPERTY_PLACEHOLDER,
      },
    } as unknown as Event;

    component.onImageError(fakeEvent);
    expect((fakeEvent.target as HTMLImageElement).src).toBe(
      DEFAULT_PROPERTY_PLACEHOLDER
    );
  });
});
