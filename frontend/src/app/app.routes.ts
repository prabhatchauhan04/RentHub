
/*
 * Defines all application routes and their access restrictions.
 * Protects landlord and tenant pages using authentication and role guards.
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

import { HomeComponent } from './features/properties/pages/home/home.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { SignupComponent } from './features/auth/pages/signup/signup.component';
import { PropertyDetailsComponent } from './features/properties/pages/property-details/property-details.component';
import { CreatePropertyComponent } from './features/properties/pages/create-property/create-property.component';
import { MyPropertiesComponent } from './features/properties/pages/my-properties/my-properties.component';
import { FavouritesComponent } from './features/favourites/pages/favourites/favourites.component';
import { NotificationsComponent } from './features/inquiries/pages/notifications/notifications.component';
import { SentInquiriesComponent } from './features/inquiries/pages/sent-inquiries/sent-inquiries.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'properties/create',
    component: CreatePropertyComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['LANDLORD'] }
  },
  {
    path: 'properties/mine',
    component: MyPropertiesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['LANDLORD'] }
  },
  {
    path: 'properties/:id/edit',
    component: CreatePropertyComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['LANDLORD'] }
  },
  {
    path: 'properties/:id',
    component: PropertyDetailsComponent
  },
  {
    path: 'favourites',
    component: FavouritesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['TENANT'] }
  },
  {
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['LANDLORD'] }
  },
  {
    path: 'inquiries/sent',
    component: SentInquiriesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['TENANT'] }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
