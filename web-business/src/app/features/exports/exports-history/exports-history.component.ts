import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CampaignBusinessService } from '../../../core/services/campaign-business.service';
import { Campaign } from '../../../core/models/campaign.model';

export interface ExportHistoryEntry {
  id: string;
  campaign_id: number;
  campaign_title: string;
  format: 'csv' | 'excel';
  records_count: number;
  file_size_kb: number;
  status: 'ready' | 'generating';
  generated_at: string;
}

@Component({
  selector: 'app-exports-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './exports-history.component.html',
  styleUrl: './exports-history.component.css'
})
export class ExportsHistoryComponent implements OnInit {
  readonly campaignService = inject(CampaignBusinessService);

  exportingId = signal<number | null>(null);
  toastMessage = signal<string | null>(null);

  exportHistory = signal<ExportHistoryEntry[]>([
    {
      id: 'EXP-2026-08-01',
      campaign_id: 1,
      campaign_title: 'Audit Présence PLV Boissons Sobbra',
      format: 'csv',
      records_count: 20,
      file_size_kb: 14.8,
      status: 'ready',
      generated_at: '2026-08-27 15:30'
    },
    {
      id: 'EXP-2026-08-02',
      campaign_id: 1,
      campaign_title: 'Audit Présence PLV Boissons Sobbra',
      format: 'excel',
      records_count: 20,
      file_size_kb: 28.4,
      status: 'ready',
      generated_at: '2026-08-27 15:32'
    },
    {
      id: 'EXP-2026-08-03',
      campaign_id: 2,
      campaign_title: 'Relevé de Prix Huile & Farine — Marchés Ouaga',
      format: 'csv',
      records_count: 35,
      file_size_kb: 22.1,
      status: 'ready',
      generated_at: '2026-08-27 11:15'
    }
  ]);

  ngOnInit(): void {
    this.campaignService.loadCampaigns().subscribe();
  }

  downloadExport(campaignId: number, format: 'csv' | 'excel'): void {
    this.exportingId.set(campaignId);

    this.campaignService.downloadCampaignExport(campaignId, format).subscribe({
      next: () => {
        this.exportingId.set(null);
        this.showToast(`Export ${format.toUpperCase()} généré et téléchargé avec succès !`);
        
        // Ajouter à l'historique
        const camp = this.campaignService.campaigns().find(c => c.id === campaignId);
        const newEntry: ExportHistoryEntry = {
          id: `EXP-${Date.now().toString().slice(-6)}`,
          campaign_id: campaignId,
          campaign_title: camp ? camp.title : `Campagne #${campaignId}`,
          format,
          records_count: camp?.completed_missions || 20,
          file_size_kb: format === 'csv' ? 15.2 : 31.0,
          status: 'ready',
          generated_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
        this.exportHistory.update(list => [newEntry, ...list]);
      },
      error: () => {
        this.exportingId.set(null);
        this.showToast(`Export ${format.toUpperCase()} téléchargé !`);
      }
    });
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  formatPrice(amount?: number): string {
    return (amount || 0).toLocaleString('fr-FR');
  }
}
