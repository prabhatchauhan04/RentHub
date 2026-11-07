
/*
 * Handles user login for tenants and landlords.
 * Authenticates users and redirects them to the home page.
 */

import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  submitLogin(): void {
    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login({
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.isLoading = false;
        let message = 'Unable to log in. Please check your credentials.';
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
