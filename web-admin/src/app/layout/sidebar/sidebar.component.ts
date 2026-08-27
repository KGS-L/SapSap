import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../../core/services/sidebar.service';
import { AdminStatsService } from '../../core/services/admin-stats.service';
import { AuthService } from '../../core/services/auth.service';
import { NavSection } from '../../core/models/nav-item.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  readonly sidebarService = inject(SidebarService);
  readonly statsService = inject(AdminStatsService);
  readonly authService = inject(AuthService);

  readonly navSections: NavSection[] = [
    {
      title: 'VUE GLOBALE',
      items: [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          route: '/dashboard',
          icon: 'dashboard',
          exact: true
        }
      ]
    },
    {
      title: 'MODÉRATION & TERRAIN',
      items: [
        {
          id: 'campaigns',
          label: 'Modération Campagnes',
          route: '/campaigns',
          icon: 'campaign',
          badge: this.statsService.stats().pendingCampaigns,
          badgeType: 'warning'
        },
        {
          id: 'submissions',
          label: 'Revue des Soumissions',
          route: '/submissions',
          icon: 'camera',
          badge: this.statsService.stats().pendingSubmissions,
          badgeType: 'info'
        },
        {
          id: 'fraud',
          label: 'Alertes Anti-Fraude',
          route: '/fraud-alerts',
          icon: 'shield',
          badge: this.statsService.stats().fraudAlerts,
          badgeType: 'danger'
        }
      ]
    },
    {
      title: 'SYSTÈME & UTILISATEURS',
      items: [
        {
          id: 'users',
          label: 'Utilisateurs & Rôles',
          route: '/users',
          icon: 'users'
        },
        {
          id: 'settings',
          label: 'Paramètres Système',
          route: '/settings',
          icon: 'settings'
        }
      ]
    }
  ];

  onNavigate(): void {
    if (this.sidebarService.isMobileOpen()) {
      this.sidebarService.closeMobile();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
