
/*
 * Manages user authentication and the current logged-in user.
 * Stores the JWT token and user information for authenticated requests.
 */

import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, timeout, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../core/models/models';

interface AuthResponse {
  success?: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
  user?: User;
  token?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'TENANT' | 'LANDLORD';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly tokenKey = 'renthub_token';
  private readonly userKey = 'renthub_user';

  private readonly userSubject = new BehaviorSubject<User | null>(
    this.getStoredUser()
  );

  readonly currentUser$ = this.userSubject.asObservable();

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  login(payload: LoginPayload): Observable<User> {
    // 10-second request timeout; network-level failures surface as TimeoutError.
    return this.api.post<AuthResponse>('/auth/login', payload).pipe(
      timeout(10000),
      map(response => this.extractAuthData(response)),
      tap(({ user, token }) => this.saveSession(user, token)),
      map(({ user }) => user),
      catchError(error => {
        if (error?.name === 'TimeoutError') {
          return throwError(() => new Error('Request timed out. Please check your connection and try again.'));
        }
        return throwError(() => error);
      })
    );
  }

  register(payload: RegisterPayload): Observable<User> {
    // 10-second request timeout; network-level failures surface as TimeoutError.
    return this.api.post<AuthResponse>('/auth/register', payload).pipe(
      timeout(10000),
      map(response => this.extractAuthData(response)),
      tap(({ user, token }) => this.saveSession(user, token)),
      map(({ user }) => user),
      catchError(error => {
        if (error?.name === 'TimeoutError') {
          return throwError(() => new Error('Request timed out. Please check your connection and try again.'));
        }
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    // Clear both persisted token and user profile from localStorage.
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userSubject.next(null);
  }

  private saveSession(user: User, token: string): void {
    // Persist token and user profile so the session survives page reloads.
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private getStoredUser(): User | null {
    const storedUser = localStorage.getItem(this.userKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      // Malformed localStorage JSON (e.g. cleared by another tab) is treated as no session.
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  private extractAuthData(response: AuthResponse): {
    user: User;
    token: string;
  } {
    // Backend may wrap auth data under `data` or return it at the top level.
    const data = response.data ?? response;

    if (!data.user || !data.token) {
      throw new Error('Invalid authentication response from server.');
    }

    return {
      user: data.user,
      token: data.token
    };
  }
}
