import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FraudAdminService } from '../../../core/services/fraud-admin.service';
import { FraudAlert, FraudAlertType, FraudSeverity } from '../../../core/models/fraud.model';

@Component({
  selector: 'app-fraud-alerts',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './fraud-alerts.component.html',
  styleUrl: './fraud-alerts.component.css'
})
export class FraudAlertsComponent implements OnInit {
  readonly fraudService = inject(FraudAdminService);

  activeTab = signal<'all' | 'pending' | 'duplicate_image' | 'device_sharing' | 'resolved'>('all');

  // Modales d'investigation et d'action
  readonly isInvestigateModalOpen = signal<boolean>(false);
  readonly isSanctionModalOpen = signal<boolean>(false);
  readonly isDismissModalOpen = signal<boolean>(false);
  readonly selectedAlert = signal<FraudAlert | null>(null);

  // Formulaires d'action
  sanctionAction: 'account_suspended' | 'score_penalized' | 'warning_issued' = 'account_suspended';
  actionNote = '';
  actionFeedback = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    const tab = this.activeTab();
    let statusFilter = 'all';
    let typeFilter = 'all';

    if (tab === 'pending') {
      statusFilter = 'pending';
    } else if (tab === 'resolved') {
      statusFilter = 'resolved';
    } else if (tab === 'duplicate_image') {
      typeFilter = 'duplicate_image';
    } else if (tab === 'device_sharing') {
      typeFilter = 'device_sharing';
    }

    this.fraudService.loadAlerts(statusFilter, typeFilter).subscribe();
  }

  setTab(tab: 'all' | 'pending' | 'duplicate_image' | 'device_sharing' | 'resolved'): void {
    this.activeTab.set(tab);
    this.loadAlerts();
  }

  openInvestigateModal(alert: FraudAlert): void {
    this.selectedAlert.set(alert);
    this.isInvestigateModalOpen.set(true);
  }

  closeInvestigateModal(): void {
    this.isInvestigateModalOpen.set(false);
  }

  openSanctionModal(alert: FraudAlert): void {
    this.selectedAlert.set(alert);
    this.sanctionAction = 'account_suspended';
    this.actionNote = '';
    this.isSanctionModalOpen.set(true);
  }

  closeSanctionModal(): void {
    this.isSanctionModalOpen.set(false);
  }

  confirmSanction(): void {
    const alert = this.selectedAlert();
    if (!alert) return;

    this.fraudService.resolveAlert(alert.id, this.sanctionAction, this.actionNote).subscribe({
      next: () => {
        this.closeSanctionModal();
        this.closeInvestigateModal();
        let actionLabel = 'Compte suspendu';
        if (this.sanctionAction === 'score_penalized') actionLabel = 'Pénalité de 15 points appliquée';
        if (this.sanctionAction === 'warning_issued') actionLabel = 'Avertissement envoyé';
        this.showFeedback(`Sanction validée : ${actionLabel} pour ${alert.user?.name || 'le contributeur'}.`);
        this.loadAlerts();
      }
    });
  }

  openDismissModal(alert: FraudAlert): void {
    this.selectedAlert.set(alert);
    this.actionNote = '';
    this.isDismissModalOpen.set(true);
  }

  closeDismissModal(): void {
    this.isDismissModalOpen.set(false);
  }

  confirmDismiss(): void {
    const alert = this.selectedAlert();
    if (!alert) return;

    this.fraudService.dismissAlert(alert.id, this.actionNote || 'Faux positif vérifié par l\'administrateur').subscribe({
      next: () => {
        this.closeDismissModal();
        this.closeInvestigateModal();
        this.showFeedback(`L'alerte #${alert.id} a été classée sans suite (faux positif).`);
        this.loadAlerts();
      }
    });
  }

  getSeverityBadge(severity?: FraudSeverity): { label: string; cssClass: string } {
    switch (severity) {
      case 'high':
        return { label: 'Critique', cssClass: 'badge-danger' };
      case 'medium':
        return { label: 'Moyenne', cssClass: 'badge-warning' };
      default:
        return { label: 'Faible', cssClass: 'badge-info' };
    }
  }

  getAlertTypeBadge(type?: FraudAlertType): { label: string; icon: string; cssClass: string } {
    switch (type) {
      case 'duplicate_image':
        return { label: 'Empreinte SHA-256 Dupliquée', icon: '🖼️', cssClass: 'type-sha256' };
      case 'device_sharing':
        return { label: 'Multi-comptes (Device ID)', icon: '📱', cssClass: 'type-device' };
      case 'gps_spoofing':
        return { label: 'Écart GPS Anormal', icon: '📍', cssClass: 'type-gps' };
      default:
        return { label: type || 'Anomalie', icon: '⚠️', cssClass: '' };
    }
  }

  copyHashToClipboard(hash: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hash);
      this.showFeedback('Hash SHA-256 copié dans le presse-papier.');
    }
  }

  private showFeedback(msg: string): void {
    this.actionFeedback.set(msg);
    setTimeout(() => {
      this.actionFeedback.set(null);
    }, 4500);
  }
}
