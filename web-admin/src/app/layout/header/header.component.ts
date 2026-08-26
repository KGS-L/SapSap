import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarService } from '../../core/services/sidebar.service';
import { AdminStatsService } from '../../core/services/admin-stats.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  readonly sidebarService = inject(SidebarService);
  readonly statsService = inject(AdminStatsService);
  private readonly router = inject(Router);

  currentTitle = 'Tableau de bord';
  notificationsOpen = false;

  readonly notifications = [
    {
      id: 1,
      title: 'Campagne à modérer',
      desc: 'Nouvelle campagne "Audit Disponibilité Orange" soumise par Telecel BF',
      time: 'Il y a 10 min',
      type: 'warning'
    },
    {
      id: 2,
      title: 'Alerte Anti-Fraude SHA-256',
      desc: 'Doublon photo détecté sur la mission #892 (Secteur 12)',
      time: 'Il y a 25 min',
      type: 'danger'
    },
    {
      id: 3,
      title: 'Auto-validation 48h exécutée',
      desc: '12 soumissions échues validées automatiquement et payées',
      time: 'Il y a 1h',
      type: 'success'
    }
  ];

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateTitleFromRoute(event.urlAfterRedirects || event.url);
    });
  }

  private updateTitleFromRoute(url: string): void {
    if (url.includes('/campaigns')) {
      this.currentTitle = 'Modération des Campagnes';
    } else if (url.includes('/submissions')) {
      this.currentTitle = 'Revue des Soumissions Terrain';
    } else if (url.includes('/fraud-alerts')) {
      this.currentTitle = 'Surveillance Anti-Fraude';
    } else if (url.includes('/users')) {
      this.currentTitle = 'Utilisateurs & Permissions RBAC';
    } else if (url.includes('/settings')) {
      this.currentTitle = 'Paramètres Système';
    } else {
      this.currentTitle = 'Tableau de bord';
    }
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
  }
}
