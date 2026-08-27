import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CampaignsListComponent } from './features/campaigns/campaigns-list/campaigns-list.component';
import { SubmissionsListComponent } from './features/submissions/submissions-list/submissions-list.component';
import { FraudAlertsComponent } from './features/fraud/fraud-alerts/fraud-alerts.component';
import { UsersListComponent } from './features/users/users-list/users-list.component';
import { SettingsComponent } from './features/settings/settings.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Connexion Administrateur | SapSap'
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, title: 'Tableau de bord | SapSap Admin' },
      { path: 'campaigns', component: CampaignsListComponent, title: 'Modération des Campagnes | SapSap Admin' },
      { path: 'submissions', component: SubmissionsListComponent, title: 'Revue des Soumissions | SapSap Admin' },
      { path: 'fraud-alerts', component: FraudAlertsComponent, title: 'Alertes Anti-Fraude | SapSap Admin' },
      { path: 'users', component: UsersListComponent, title: 'Utilisateurs & Rôles | SapSap Admin' },
      { path: 'settings', component: SettingsComponent, title: 'Paramètres Système | SapSap Admin' }
    ]
  },
  { path: '**', redirectTo: '' }
];
