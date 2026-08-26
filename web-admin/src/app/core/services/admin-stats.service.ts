import { Injectable, signal } from '@angular/core';
import { AdminStats } from '../models/nav-item.model';

@Injectable({
  providedIn: 'root'
})
export class AdminStatsService {
  /** Statistiques clés du portail d'administration */
  readonly stats = signal<AdminStats>({
    pendingCampaigns: 4,
    pendingSubmissions: 18,
    fraudAlerts: 3,
    activeContributors: 142,
    autoValidationSchedulerActive: true,
    lastAutoValidationCheck: 'Il y a 14 min'
  });

  /** Informations sur l'administrateur connecté */
  readonly currentUser = signal({
    name: 'Admin SapSap',
    email: 'superadmin@sapsap.bf',
    role: 'Super Administrateur',
    roleCode: 'super-admin',
    avatar: 'assets/avatar.png'
  });

  updateStats(newStats: Partial<AdminStats>): void {
    this.stats.update(current => ({ ...current, ...newStats }));
  }
}
