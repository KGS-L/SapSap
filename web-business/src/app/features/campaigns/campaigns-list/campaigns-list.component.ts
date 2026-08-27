import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CampaignBusinessService } from '../../../core/services/campaign-business.service';
import { Campaign } from '../../../core/models/campaign.model';

@Component({
  selector: 'app-campaigns-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './campaigns-list.component.html',
  styleUrl: './campaigns-list.component.css'
})
export class CampaignsListComponent implements OnInit {
  readonly campaignService = inject(CampaignBusinessService);

  activeFilter: 'all' | 'active' | 'pending' | 'completed' = 'all';

  ngOnInit(): void {
    this.campaignService.loadCampaigns().subscribe();
  }

  setFilter(filter: 'all' | 'active' | 'pending' | 'completed'): void {
    this.activeFilter = filter;
  }

  get filteredCampaigns(): Campaign[] {
    const list = this.campaignService.campaigns();
    if (this.activeFilter === 'all') {
      return list;
    }
    return list.filter(c => c.status === this.activeFilter);
  }

  formatPrice(amount?: number): string {
    return (amount || 0).toLocaleString('fr-FR');
  }
}
