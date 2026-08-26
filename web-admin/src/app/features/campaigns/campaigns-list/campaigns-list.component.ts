import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-campaigns-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campaigns-list.component.html',
  styleUrl: './campaigns-list.component.css'
})
export class CampaignsListComponent {
  activeTab: 'pending' | 'approved' | 'rejected' | 'all' = 'pending';

  campaigns = [
    {
      id: 'CMP-2026-004',
      title: 'Audit Présence PLV Boissons Sobbra',
      company: 'Sobbra Distribution BF',
      city: 'Ouagadougou',
      type: 'Audit & Présence',
      missionsCount: 150,
      rewardPerMission: 3000,
      totalBudget: 450000,
      createdAt: '26/08/2026 14:15',
      status: 'pending',
      criteria: 'Photo façade + Photo rayon + Questionnaire 4 questions'
    },
    {
      id: 'CMP-2026-003',
      title: 'Relevé Prix Carburant Total / Shell',
      company: 'Observatoire Énergétique',
      city: 'Ouagadougou & Périphérie',
      type: 'Relevé de prix',
      missionsCount: 60,
      rewardPerMission: 2500,
      totalBudget: 180000,
      createdAt: '26/08/2026 11:30',
      status: 'pending',
      criteria: 'Photo totem tarifaire + Saisie prix Super91 et Gasoil'
    },
    {
      id: 'CMP-2026-002',
      title: 'Contrôle Boutiques Orange Money',
      company: 'Orange Burkina SA',
      city: 'Ouaga 2000, Patte d\'Oie',
      type: 'Vérification point de vente',
      missionsCount: 200,
      rewardPerMission: 2500,
      totalBudget: 600000,
      createdAt: '25/08/2026 16:40',
      status: 'approved',
      criteria: 'Vérification grille tarifaire visible + liquidité disponible'
    }
  ];

  setTab(tab: 'pending' | 'approved' | 'rejected' | 'all'): void {
    this.activeTab = tab;
  }

  get filteredCampaigns() {
    if (this.activeTab === 'all') return this.campaigns;
    return this.campaigns.filter(c => c.status === this.activeTab);
  }
}
