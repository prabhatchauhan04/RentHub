/*
 * Adds the stored JWT token to outgoing API requests.
 * Allows the backend to identify and authorize authenticated users.
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;

  // Only attach the bearer token for requests to our own backend API;
  // third-party URLs (e.g. Cloudinary) must not receive our JWT.
  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authenticatedRequest);
};
