import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  /** État replié / étendu de la sidebar desktop */
  readonly isCollapsed = signal<boolean>(false);

  /** État ouvert / fermé du drawer mobile */
  readonly isMobileOpen = signal<boolean>(false);

  toggleCollapse(): void {
    this.isCollapsed.update(val => !val);
  }

  setCollapsed(collapsed: boolean): void {
    this.isCollapsed.set(collapsed);
  }

  toggleMobile(): void {
    this.isMobileOpen.update(val => !val);
  }

  closeMobile(): void {
    this.isMobileOpen.set(false);
  }

  openMobile(): void {
    this.isMobileOpen.set(true);
  }
}
