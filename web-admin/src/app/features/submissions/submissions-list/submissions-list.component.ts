import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubmissionAdminService } from '../../../core/services/submission-admin.service';
import { Submission } from '../../../core/models/submission.model';

@Component({
  selector: 'app-submissions-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './submissions-list.component.html',
  styleUrl: './submissions-list.component.css'
})
export class SubmissionsListComponent implements OnInit {
  readonly submissionService = inject(SubmissionAdminService);

  activeTab: 'submitted' | 'validated' | 'auto_validated' | 'rejected' | 'fraud_suspect' | 'all' = 'submitted';

  // Desk Split-Screen & Modal states
  readonly isInspectModalOpen = signal<boolean>(false);
  readonly isRejectModalOpen = signal<boolean>(false);
  readonly isShortcutsHelpOpen = signal<boolean>(false);
  readonly isFraudModalOpen = signal<boolean>(false);
  readonly isZoomed = signal<boolean>(false);

  readonly selectedSubmission = signal<Submission | null>(null);
  readonly zoomedPhoto = signal<string | null>(null);
  readonly currentQueueIndex = signal<number>(0);

  rejectionReason = '';
  fraudReason = 'Suspicion de fraude ou falsification photo détectée lors de la revue terrain.';
  actionFeedback = signal<string | null>(null);

  // Predefined rejection reasons for 1-click selection
  readonly quickRejectionPresets = [
    { label: 'Photo floue / illisible', text: 'La photo transmise est floue, trop sombre ou ne permet pas d\'auditer clairement le point de vente.' },
    { label: 'Écart GPS > 100m', text: 'La prise de vue a été réalisée en dehors du périmètre autorisé (> 100m du point cible).' },
    { label: 'Enseigne / PLV non conforme', text: 'L\'affiche ou l\'enseigne photographiée ne correspond pas aux consignes de la campagne.' },
    { label: 'Photo d\'écran ou doublon', text: 'La photo semble être une capture d\'écran ou une réutilisation non autorisée.' }
  ];

  ngOnInit(): void {
    this.loadSubmissions();
  }

  loadSubmissions(): void {
    this.submissionService.loadSubmissions(this.activeTab).subscribe({
      next: (res: any) => {
        // If an item was selected, keep sync
        const current = this.selectedSubmission();
        if (current && res?.data) {
          const updated = res.data.find((s: Submission) => s.id === current.id);
          if (updated) {
            this.selectedSubmission.set(updated);
          }
        }
      }
    });
  }

  setTab(tab: 'submitted' | 'validated' | 'auto_validated' | 'rejected' | 'fraud_suspect' | 'all'): void {
    this.activeTab = tab;
    this.loadSubmissions();
  }

  /**
   * Keyboard Shortcuts Handler (@HostListener)
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const isInputActive = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    );

    // If typing in input/textarea, only handle Escape or Ctrl+Enter
    if (isInputActive) {
      if (event.key === 'Escape') {
        if (this.isRejectModalOpen()) this.closeRejectModal();
        if (this.isFraudModalOpen()) this.closeFraudModal();
        if (this.isShortcutsHelpOpen()) this.toggleShortcutsHelp();
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        if (this.isRejectModalOpen()) {
          event.preventDefault();
          this.confirmReject();
        } else if (this.isFraudModalOpen()) {
          event.preventDefault();
          this.confirmFraud();
        }
      }
      return;
    }

    // Modal close on Escape
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.isRejectModalOpen()) {
        this.closeRejectModal();
      } else if (this.isFraudModalOpen()) {
        this.closeFraudModal();
      } else if (this.isShortcutsHelpOpen()) {
        this.toggleShortcutsHelp();
      } else if (this.isInspectModalOpen()) {
        this.closeInspectModal();
      }
      return;
    }

    // Toggle Keyboard Shortcut Help with '?' or 'h'
    if (event.key === '?' || event.key === 'h' || event.key === 'H') {
      event.preventDefault();
      this.toggleShortcutsHelp();
      return;
    }

    // Navigation & Actions when Split-Screen Desk is Active
    if (this.isInspectModalOpen()) {
      const sub = this.selectedSubmission();

      // [E] or [V] -> Validate & Payout
      if ((event.key === 'e' || event.key === 'E' || event.key === 'v' || event.key === 'V') && sub) {
        if (sub.status === 'submitted' || sub.status === 'fraud_suspect') {
          event.preventDefault();
          this.onValidate(sub);
        }
      }
      // [R] -> Reject with reason
      else if ((event.key === 'r' || event.key === 'R') && sub) {
        if (sub.status === 'submitted' || sub.status === 'fraud_suspect') {
          event.preventDefault();
          this.openRejectModal(sub);
        }
      }
      // [F] -> Flag Fraud
      else if ((event.key === 'f' || event.key === 'F') && sub) {
        event.preventDefault();
        this.openFraudModal(sub);
      }
      // [J] or [ArrowRight] or [ArrowDown] or [N] -> Next in queue
      else if (event.key === 'j' || event.key === 'J' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        this.goToNextSubmission();
      }
      // [K] or [ArrowLeft] or [ArrowUp] or [P] -> Previous in queue
      else if (event.key === 'k' || event.key === 'K' || event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        this.goToPreviousSubmission();
      }
      // [Z] -> Toggle Photo Zoom
      else if (event.key === 'z' || event.key === 'Z') {
        event.preventDefault();
        this.toggleZoom();
      }
    } else {
      // If table view is active, pressing 'Enter' or 'Space' on row opens first pending
      if (event.key === 'j' || event.key === 'ArrowDown') {
        const list = this.submissionService.submissions();
        if (list.length > 0) {
          event.preventDefault();
          this.openInspectModal(list[0], 0);
        }
      }
    }
  }

  openInspectModal(sub: Submission, index?: number): void {
    const list = this.submissionService.submissions();
    const idx = index !== undefined ? index : list.findIndex(s => s.id === sub.id);
    this.currentQueueIndex.set(idx >= 0 ? idx : 0);
    this.selectedSubmission.set(sub);
    this.zoomedPhoto.set(sub.photos && sub.photos.length > 0 ? sub.photos[0] : null);
    this.isZoomed.set(false);
    this.isInspectModalOpen.set(true);
  }

  closeInspectModal(): void {
    this.isInspectModalOpen.set(false);
    this.selectedSubmission.set(null);
    this.zoomedPhoto.set(null);
    this.isZoomed.set(false);
  }

  goToNextSubmission(): void {
    const list = this.submissionService.submissions();
    if (list.length === 0) return;
    const nextIdx = (this.currentQueueIndex() + 1) % list.length;
    this.openInspectModal(list[nextIdx], nextIdx);
  }

  goToPreviousSubmission(): void {
    const list = this.submissionService.submissions();
    if (list.length === 0) return;
    const prevIdx = (this.currentQueueIndex() - 1 + list.length) % list.length;
    this.openInspectModal(list[prevIdx], prevIdx);
  }

  toggleZoom(): void {
    this.isZoomed.update(z => !z);
  }

  toggleShortcutsHelp(): void {
    this.isShortcutsHelpOpen.update(v => !v);
  }

  onValidate(sub: Submission): void {
    this.submissionService.validateSubmission(sub.id).subscribe({
      next: () => {
        this.showFeedback(`✓ Soumission #${sub.id} validée. ${this.formatPrice(sub.mission?.reward)} FCFA crédités à ${sub.user?.name || 'Contributeur'}.`);
        // If there are more submissions, auto-advance or update status
        const currentList = this.submissionService.submissions();
        const pendingRemaining = currentList.filter(s => s.id !== sub.id && (s.status === 'submitted' || s.status === 'fraud_suspect'));
        if (pendingRemaining.length > 0) {
          const nextSub = pendingRemaining[0];
          const nextIdx = currentList.findIndex(s => s.id === nextSub.id);
          this.openInspectModal(nextSub, nextIdx);
        } else {
          this.closeInspectModal();
        }
      }
    });
  }

  openRejectModal(sub: Submission): void {
    this.selectedSubmission.set(sub);
    this.rejectionReason = '';
    this.isRejectModalOpen.set(true);
  }

  closeRejectModal(): void {
    this.isRejectModalOpen.set(false);
    this.rejectionReason = '';
  }

  applyQuickReason(reasonText: string): void {
    this.rejectionReason = reasonText;
  }

  confirmReject(): void {
    const sub = this.selectedSubmission();
    if (!sub || !this.rejectionReason.trim()) {
      return;
    }

    this.submissionService.rejectSubmission(sub.id, this.rejectionReason.trim()).subscribe({
      next: () => {
        this.closeRejectModal();
        this.showFeedback(`⚠️ Soumission #${sub.id} rejetée. Motif consigné pour le contributeur.`);
        // Auto-advance
        const currentList = this.submissionService.submissions();
        const pendingRemaining = currentList.filter(s => s.id !== sub.id && (s.status === 'submitted' || s.status === 'fraud_suspect'));
        if (pendingRemaining.length > 0) {
          const nextSub = pendingRemaining[0];
          const nextIdx = currentList.findIndex(s => s.id === nextSub.id);
          this.openInspectModal(nextSub, nextIdx);
        } else {
          this.closeInspectModal();
        }
      }
    });
  }

  openFraudModal(sub: Submission): void {
    this.selectedSubmission.set(sub);
    this.isFraudModalOpen.set(true);
  }

  closeFraudModal(): void {
    this.isFraudModalOpen.set(false);
  }

  confirmFraud(): void {
    const sub = this.selectedSubmission();
    if (!sub) return;

    this.submissionService.rejectSubmission(sub.id, `[Alerte Fraude] ${this.fraudReason.trim()}`).subscribe({
      next: () => {
        this.closeFraudModal();
        this.showFeedback(`🛡️ Soumission #${sub.id} signalée en fraude.`);
        this.goToNextSubmission();
      }
    });
  }

  getAnswerEntries(answers?: Record<string, string>): { key: string; value: string }[] {
    if (!answers) {
      return [];
    }
    return Object.entries(answers).map(([key, value]) => ({ key, value }));
  }

  setZoomedPhoto(url: string): void {
    this.zoomedPhoto.set(url);
  }

  formatPrice(amount?: number): string {
    return (amount || 0).toLocaleString('fr-FR');
  }

  formatDateShort(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  formatDateTimeFull(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  private showFeedback(msg: string): void {
    this.actionFeedback.set(msg);
    setTimeout(() => {
      this.actionFeedback.set(null);
    }, 4500);
  }
}
