import { Routes } from '@angular/router';
import { BusinessLayoutComponent } from './layout/business-layout/business-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { CampaignsListComponent } from './features/campaigns/campaigns-list/campaigns-list.component';
import { CampaignTrackingComponent } from './features/tracking/campaign-tracking/campaign-tracking.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Connexion Espace Entreprise | SapSap'
  },
  {
    path: '',
    component: BusinessLayoutComponent,
    children: [
      { path: '', redirectTo: 'campaigns', pathMatch: 'full' },
      { path: 'campaigns', component: CampaignsListComponent, title: 'Mes Campagnes | SapSap Business' },
      { path: 'tracking/:id', component: CampaignTrackingComponent, title: 'Suivi Temps Réel & Carte | SapSap Business' },
      { path: 'tracking', redirectTo: 'tracking/1', pathMatch: 'full' },
      { path: 'exports', component: CampaignsListComponent, title: 'Exportation de Données | SapSap Business' },
      { path: 'settings', component: CampaignsListComponent, title: 'Paramètres | SapSap Business' }
    ]
  },
  { path: '**', redirectTo: '' }
];
