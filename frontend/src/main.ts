/*
 * Starts the standalone Angular application.
 * Loads the root component with the application-wide configuration.
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((error) => console.error(error));
