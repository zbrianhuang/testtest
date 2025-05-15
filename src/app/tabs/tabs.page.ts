import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,                // ← mark as standalone
  imports: [
    IonicModule,                   // ← enables all <ion-*> tags
    CommonModule,                  // ← enables *ngIf, *ngFor, etc.
    RouterModule                   // ← for routerLink/href
  ]
})
export class TabsPage {
  hideTabBar = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const url = e.urlAfterRedirects;
        this.hideTabBar =
          url === '/tabs/tab2' ||
          url.startsWith('/tabs/video-editor');
      });
  }
}