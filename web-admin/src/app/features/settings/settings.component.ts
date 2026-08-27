import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SchedulerAdminService } from '../../core/services/scheduler-admin.service';
import { AutoValidationRunResult } from '../../core/models/scheduler.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  readonly schedulerService = inject(SchedulerAdminService);

  schedulerInterval = 'Toutes les heures (0 * * * *)';
  autoValidationDelayHours = 48;
  gpsToleranceMeters = 100;
  reservationLockMinutes = 45;
  minWithdrawalFcfa = 1000;

  // Feedback notifications
  readonly actionToast = signal<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  ngOnInit(): void {
    this.schedulerService.loadStatus().subscribe();
    this.schedulerService.loadLogs().subscribe();
  }

  onTriggerAutoValidation(): void {
    this.schedulerService.runAutoValidationNow(this.autoValidationDelayHours).subscribe({
      next: (res: AutoValidationRunResult) => {
        this.showToast(res.message, 'success');
      },
      error: () => {
        this.showToast("Erreur lors de l'exécution du planificateur.", 'error');
      }
    });
  }

  onSaveInvariants(): void {
    this.showToast('Paramètres système et règles métier mis à jour avec succès.', 'success');
  }

  formatPrice(amount?: number): string {
    return (amount || 0).toLocaleString('fr-FR');
  }

  formatDateTime(dateStr?: string | null): string {
    if (!dateStr) return 'En attente';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  private showToast(message: string, type: 'success' | 'info' | 'error' = 'info'): void {
    this.actionToast.set({ message, type });
    setTimeout(() => {
      this.actionToast.set(null);
    }, 4500);
  }
}
