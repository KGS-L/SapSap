import { Component, inject, OnInit, signal } from '@angular/core';
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

  // Modales
  readonly isInspectModalOpen = signal<boolean>(false);
  readonly isRejectModalOpen = signal<boolean>(false);
  readonly selectedSubmission = signal<Submission | null>(null);
  readonly zoomedPhoto = signal<string | null>(null);

  rejectionReason = '';
  actionFeedback = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSubmissions();
  }

  loadSubmissions(): void {
    this.submissionService.loadSubmissions(this.activeTab).subscribe();
  }

  setTab(tab: 'submitted' | 'validated' | 'auto_validated' | 'rejected' | 'fraud_suspect' | 'all'): void {
    this.activeTab = tab;
    this.loadSubmissions();
  }

  openInspectModal(sub: Submission): void {
    this.selectedSubmission.set(sub);
    this.zoomedPhoto.set(sub.photos && sub.photos.length > 0 ? sub.photos[0] : null);
    this.isInspectModalOpen.set(true);
  }

  closeInspectModal(): void {
    this.isInspectModalOpen.set(false);
    this.selectedSubmission.set(null);
    this.zoomedPhoto.set(null);
  }

  onValidate(sub: Submission): void {
    this.submissionService.validateSubmission(sub.id).subscribe({
      next: () => {
        this.closeInspectModal();
        this.showFeedback(`La soumission de ${sub.user?.name || 'Contributeur'} a été validée avec succès. Score crédité.`);
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

  confirmReject(): void {
    const sub = this.selectedSubmission();
    if (!sub || !this.rejectionReason.trim()) {
      return;
    }

    this.submissionService.rejectSubmission(sub.id, this.rejectionReason.trim()).subscribe({
      next: () => {
        this.closeRejectModal();
        this.closeInspectModal();
        this.showFeedback(`La soumission a été rejetée. Le motif a été consigné.`);
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
    }, 4000);
  }
}
