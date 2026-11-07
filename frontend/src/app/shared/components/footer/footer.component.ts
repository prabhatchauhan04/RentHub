
/*
 * Displays the common footer across RentHub pages.
 * Provides basic branding and a copyright notice.
 */

import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
