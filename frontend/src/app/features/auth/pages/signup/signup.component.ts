
/*
 * Handles new user registration on RentHub.
 * Allows users to register as tenants or landlords.
 */

import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AuthService,
  RegisterPayload
} from '../../../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role: 'TENANT' | 'LANDLORD' = 'TENANT';

  errorMessage = '';
  isLoading = false;

  submitSignup(): void {
    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';

    // Reject submission early if password confirmation does not match.
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      this.cdr.markForCheck();
      return;
    }

    const payload: RegisterPayload = {
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password,
      role: this.role
    };

    this.isLoading = true;
    this.cdr.markForCheck();

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.isLoading = false;
        let message = 'Unable to create your account. Please try again.';
        if (error instanceof HttpErrorResponse) {
          // status 0 means the request never reached the server (network failure, CORS, etc.).
          if (error.status === 0) {
            message = 'Cannot reach the server.';
          } else {
            message = error.error?.message || message;
          }
        } else if (error instanceof Error) {
          message = error.message;
        }
        this.errorMessage = message;
        this.cdr.markForCheck();
      }
    });
  }
}
