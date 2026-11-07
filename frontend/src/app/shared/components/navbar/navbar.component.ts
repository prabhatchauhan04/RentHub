/*
 * Provides the main navigation bar for RentHub.
 * Displays navigation links according to the user's authentication and role.
 */

import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  showEmail = false;

  toggleUserMenu(): void {
    this.showEmail = !this.showEmail;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
