import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminStatsService } from '../../core/services/admin-stats.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  readonly statsService = inject(AdminStatsService);

  readonly recentCampaigns = [
    {
      id: 'CMP-2026-004',
      title: 'Audit Présence PLV Boissons Sobbra',
      company: 'Sobbra Distribution BF',
      city: 'Ouagadougou (Secteurs 1-15)',
      budget: '450 000 FCFA',
      missionsCount: 150,
      rewardPerMission: '3 000 FCFA',
      submittedAt: 'Il y a 25 min',
      status: 'pending'
    },
    {
      id: 'CMP-2026-003',
      title: 'Relevé Prix Carburant Total / Shell',
      company: 'Observatoire Énergétique',
      city: 'Ouagadougou & Périphérie',
      budget: '180 000 FCFA',
      missionsCount: 60,
      rewardPerMission: '2 500 FCFA',
      submittedAt: 'Il y a 2h',
      status: 'pending'
    },
    {
      id: 'CMP-2026-002',
      title: 'Contrôle Boutiques Orange Money',
      company: 'Orange Burkina SA',
      city: 'Ouaga 2000, Patte d\'Oie',
      budget: '600 000 FCFA',
      missionsCount: 200,
      rewardPerMission: '2 500 FCFA',
      submittedAt: 'Hier à 16:40',
      status: 'approved'
    }
  ];

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
