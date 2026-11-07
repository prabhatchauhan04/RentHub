/*
 * Unit tests for AppComponent.
 * Covers component creation.
 */

import { AppComponent } from '../app/app.component';

describe('AppComponent', () => {
  it('should create the app component', () => {
    const component = new AppComponent();
    expect(component).toBeTruthy();
  });
});
