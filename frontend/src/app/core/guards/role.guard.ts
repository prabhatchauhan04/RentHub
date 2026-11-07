/*
 * Restricts routes to users with the required role.
 * Redirects users who do not have the required permissions.
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../models/models';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser;
  const allowedRoles = route.data['roles'] as Role[] | undefined;

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // Allow access when no roles are specified on the route, or when the user's role matches.
  if (!allowedRoles || allowedRoles.includes(user.role)) {
    return true;
  }

  // User is authenticated but lacks the required role; send them home.
  return router.createUrlTree(['/']);
};
