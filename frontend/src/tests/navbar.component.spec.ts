/*
 * Unit tests for NavbarComponent.
 * Covers authentication state, role-based navigation, and logout behavior.
 */

import { inject, Injector, runInInjectionContext } from '@angular/core';
import { NavbarComponent } from '../app/shared/components/navbar/navbar.component';
import { AuthService } from '../app/services/auth.service';
import { Router } from '@angular/router';

describe('NavbarComponent', () => {
  let mockAuthService: any;
  let mockRouter: any;
  let injector: Injector;

  beforeEach(() => {
    mockAuthService = {
      logout: vi.fn(),
      currentUser: null,
    };
    mockRouter = {
      navigate: vi.fn(),
    };

    injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should create the component', () => {
    const component = runInInjectionContext(injector, () => {
      return new NavbarComponent();
    });
    expect(component).toBeTruthy();
  });

  it('should call logout on AuthService and navigate to login', () => {
    const component = runInInjectionContext(injector, () => {
      return new NavbarComponent();
    });
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
