import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CampaignBusinessService } from '../../core/services/campaign-business.service';

@Component({
  selector: 'app-business-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './business-layout.component.html',
  styleUrl: './business-layout.component.css'
})
export class BusinessLayoutComponent {
  readonly authService = inject(AuthService);
  readonly campaignService = inject(CampaignBusinessService);
  private readonly router = inject(Router);

  isSidebarCollapsed = false;

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  switchCompany(company: 'sobbra' | 'orange'): void {
    if (company === 'orange') {
      this.authService.login('business@orange.bf');
    } else {
      this.authService.login('business@sobbra.bf');
    }
    this.campaignService.loadCampaigns().subscribe();
  }
}
