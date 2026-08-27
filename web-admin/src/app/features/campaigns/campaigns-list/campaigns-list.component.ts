import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CampaignAdminService } from '../../../core/services/campaign-admin.service';
import { Campaign } from '../../../core/models/campaign.model';

@Component({
  selector: 'app-campaigns-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './campaigns-list.component.html',
  styleUrl: './campaigns-list.component.css'
})
export class CampaignsListComponent implements OnInit {
  readonly campaignService = inject(CampaignAdminService);

  activeTab: 'pending' | 'active' | 'rejected' | 'all' = 'pending';

  // États des modales
  readonly isRejectModalOpen = signal<boolean>(false);
  readonly isDetailsModalOpen = signal<boolean>(false);
  readonly selectedCampaign = signal<Campaign | null>(null);
  
  rejectionReason = '';
  actionFeedback = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.campaignService.loadCampaigns(this.activeTab).subscribe();
  }

  setTab(tab: 'pending' | 'active' | 'rejected' | 'all'): void {
    this.activeTab = tab;
    this.loadCampaigns();
  }

  onApprove(campaign: Campaign): void {
    this.campaignService.approveCampaign(campaign.id).subscribe({
      next: () => {
        this.showFeedback(`La campagne "${campaign.title}" a été approuvée et publiée avec succès.`);
      }
    });
  }

  openRejectModal(campaign: Campaign): void {
    this.selectedCampaign.set(campaign);
    this.rejectionReason = '';
    this.isRejectModalOpen.set(true);
  }

  closeRejectModal(): void {
    this.isRejectModalOpen.set(false);
    this.selectedCampaign.set(null);
    this.rejectionReason = '';
  }

  confirmReject(): void {
    const campaign = this.selectedCampaign();
    if (!campaign || !this.rejectionReason.trim()) {
      return;
    }

    this.campaignService.rejectCampaign(campaign.id, this.rejectionReason.trim()).subscribe({
      next: () => {
        this.closeRejectModal();
        this.showFeedback(`La campagne "${campaign.title}" a été rejetée.`);
      }
    });
  }

  openDetails(campaign: Campaign): void {
    this.selectedCampaign.set(campaign);
    this.isDetailsModalOpen.set(true);
  }

  closeDetails(): void {
    this.isDetailsModalOpen.set(false);
    this.selectedCampaign.set(null);
  }

  formatPrice(amount: number): string {
    return (amount || 0).toLocaleString('fr-FR');
  }

  private showFeedback(msg: string): void {
    this.actionFeedback.set(msg);
    setTimeout(() => {
      this.actionFeedback.set(null);
    }, 4000);
  }
}
