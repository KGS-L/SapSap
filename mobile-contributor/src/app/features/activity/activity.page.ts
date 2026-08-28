import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { MissionService } from '../../core/services/mission.service';
import { ReservationResponse, SubmissionItem } from '../../core/models/mission.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.page.html',
  styleUrls: ['./activity.page.scss'],
  standalone: false
})
export class ActivityPage implements OnInit, OnDestroy {
  activeReservation: ReservationResponse | null = null;
  submissions: SubmissionItem[] = [];
  filteredSubmissions: SubmissionItem[] = [];
  selectedSegment = 'all';

  remainingMinutes = 45;
  remainingSeconds = 0;
  timerString = '45:00';
  isExpired = false;

  private timerInterval: any = null;
  private subSubscription: Subscription | null = null;

  constructor(
    private missionService: MissionService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(): void {
    this.subSubscription = this.missionService.submissions$.subscribe(list => {
      this.submissions = list.length > 0 ? list : this.getMockSubmissions();
      this.applyFilter();
    });
  }

  ionViewWillEnter(): void {
    this.activeReservation = this.missionService.getActiveReservationValue();
    if (this.activeReservation) {
      this.startCountdown(this.activeReservation.expires_at);
    } else {
      this.stopCountdown();
    }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
    if (this.subSubscription) this.subSubscription.unsubscribe();
  }

  startCountdown(expiresAtIso: string): void {
    this.stopCountdown();
    const targetTime = new Date(expiresAtIso).getTime();

    const update = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        this.timerString = '00:00';
        this.isExpired = true;
        this.stopCountdown();
        this.missionService.clearActiveReservation();
        this.activeReservation = null;
      } else {
        const totalSecs = Math.floor(diff / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        this.remainingMinutes = mins;
        this.remainingSeconds = secs;
        this.timerString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        this.isExpired = false;
      }
    };

    update();
    this.timerInterval = setInterval(update, 1000);
  }

  stopCountdown(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  applyFilter(): void {
    if (this.selectedSegment === 'all') {
      this.filteredSubmissions = this.submissions;
    } else {
      this.filteredSubmissions = this.submissions.filter(s => s.status === this.selectedSegment);
    }
  }

  segmentChanged(event: any): void {
    this.selectedSegment = event.detail.value;
    this.applyFilter();
  }

  startMissionExecution(): void {
    if (this.activeReservation) {
      this.router.navigate(['/mission-execution', this.activeReservation.mission_id]);
    }
  }

  async confirmCancelReservation(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Annuler la réservation ?',
      message: 'La mission sera déverrouillée et remise à disposition pour d\'autres contributeurs.',
      buttons: [
        { text: 'Non, garder', role: 'cancel' },
        {
          text: 'Oui, annuler',
          role: 'destructive',
          handler: () => this.cancelReservation()
        }
      ]
    });
    await alert.present();
  }

  private async cancelReservation(): Promise<void> {
    if (!this.activeReservation) return;

    const loader = await this.loadingCtrl.create({
      message: 'Annulation en cours...',
      spinner: 'crescent'
    });
    await loader.present();

    this.missionService.cancelReservation(this.activeReservation.mission_id).subscribe({
      next: async () => {
        await loader.dismiss();
        this.stopCountdown();
        this.activeReservation = null;
        this.showToast('Réservation annulée.', 'success');
      },
      error: async () => {
        await loader.dismiss();
        this.missionService.clearActiveReservation();
        this.stopCountdown();
        this.activeReservation = null;
        this.showToast('Réservation retirée de votre session.', 'success');
      }
    });
  }

  getStatusBadge(status: string): { label: string; class: string } {
    switch (status) {
      case 'validated': return { label: 'Validée — Gains versés', class: 'badge-sage' };
      case 'pending_review': return { label: 'En revue (Auto 48h)', class: 'badge-buttercream' };
      case 'rejected': return { label: 'Rejetée', class: 'badge-muted' };
      default: return { label: status, class: 'badge-muted' };
    }
  }

  private getMockSubmissions(): SubmissionItem[] {
    return [
      {
        id: 501,
        mission_id: 101,
        mission_title: 'Vérification prix Sucre & Huile — Marché Somgandé',
        reward_amount: 1500,
        status: 'validated',
        submitted_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        distance_from_target_meters: 35,
        photos_count: 2
      },
      {
        id: 502,
        mission_id: 102,
        mission_title: 'Audit présence affichage Télécom — Koulouba',
        reward_amount: 2000,
        status: 'pending_review',
        submitted_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        distance_from_target_meters: 18,
        photos_count: 1,
        auto_validation_deadline: new Date(Date.now() + 42 * 3600 * 1000).toISOString()
      }
    ];
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }
}
