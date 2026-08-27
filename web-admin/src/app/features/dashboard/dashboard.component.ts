import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminStatsService } from '../../core/services/admin-stats.service';
import { CampaignAdminService } from '../../core/services/campaign-admin.service';
import { Campaign } from '../../core/models/campaign.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  readonly statsService = inject(AdminStatsService);
  readonly campaignService = inject(CampaignAdminService);

  ngOnInit(): void {
    this.campaignService.loadCampaigns().subscribe();
  }

  get pendingCampaigns(): Campaign[] {
    return this.campaignService.campaigns().filter(c => c.status === 'pending');
  }

  onApprove(campaign: Campaign): void {
    this.campaignService.approveCampaign(campaign.id).subscribe();
  }

  formatPrice(amount: number): string {
    return (amount || 0).toLocaleString('fr-FR');
  }

  readonly recentSubmissions = [
    {
      id: 'SUB-894',
      contributor: 'Moussa Ouédraogo',
      phone: '+226 70 12 34 56',
      reputation: 96,
      mission: 'Audit Boutique Kiosque #42',
      location: 'Secteur 15 (Patte d\'Oie)',
      gpsAccuracy: '8m (Écart: 22m)',
      submittedAt: 'Il y a 12 min',
      hoursLeft: '47h 48min',
      status: 'submitted'
    },
    {
      id: 'SUB-893',
      contributor: 'Amina Sawadogo',
      phone: '+226 76 98 76 54',
      reputation: 92,
      mission: 'Relevé Prix Sobbra - Maquis Le Régal',
      location: 'Secteur 28 (Dassasgho)',
      gpsAccuracy: '12m (Écart: 45m)',
      submittedAt: 'Il y a 45 min',
      hoursLeft: '47h 15min',
      status: 'submitted'
    },
    {
      id: 'SUB-892',
      contributor: 'Ibrahim Kaboré',
      phone: '+226 65 11 22 33',
      reputation: 64,
      mission: 'Contrôle Affiche Publicitaire',
      location: 'Secteur 12 (Gounghin)',
      gpsAccuracy: '6m (Écart: 140m)',
      submittedAt: 'Il y a 1h 10min',
      hoursLeft: '46h 50min',
      status: 'fraud_suspect'
    }
  ];
}
