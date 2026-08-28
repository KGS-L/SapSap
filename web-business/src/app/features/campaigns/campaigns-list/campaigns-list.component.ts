import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CampaignBusinessService } from '../../../core/services/campaign-business.service';
import { Campaign } from '../../../core/models/campaign.model';
import { CampaignWizardComponent } from '../campaign-wizard/campaign-wizard.component';

@Component({
  selector: 'app-campaigns-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CampaignWizardComponent],
  templateUrl: './campaigns-list.component.html',
  styleUrl: './campaigns-list.component.css'
})
export class CampaignsListComponent implements OnInit {
  readonly campaignService = inject(CampaignBusinessService);

  activeFilter: 'all' | 'active' | 'pending' | 'completed' = 'all';
  isWizardOpen = signal<boolean>(false);
  exportingCampaignId = signal<number | null>(null);
  toastMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.campaignService.loadCampaigns().subscribe();
  }

  openWizard(): void {
    this.isWizardOpen.set(true);
  }

  closeWizard(): void {
    this.isWizardOpen.set(false);
  }

  onCampaignCreated(campaignId: number): void {
    this.showToast('Campagne créée avec succès et soumise à modération !');
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

  exportCampaign(campaignId: number, format: 'csv' | 'excel', event: Event): void {
    event.stopPropagation();
    this.exportingCampaignId.set(campaignId);

    this.campaignService.downloadCampaignExport(campaignId, format).subscribe({
      next: () => {
        this.exportingCampaignId.set(null);
        this.showToast(`Export ${format.toUpperCase()} téléchargé !`);
      },
      error: () => {
        this.exportingCampaignId.set(null);
        this.showToast(`Export ${format.toUpperCase()} téléchargé !`);
      }
    });
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  formatPrice(amount?: number): string {
    return (amount || 0).toLocaleString('fr-FR');
  }
}
