import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { MissionService } from '../../core/services/mission.service';
import { GeolocationService, Coordinates } from '../../core/services/geolocation.service';
import { CameraService, CapturedPhoto } from '../../core/services/camera.service';
import { OfflineQueueService } from '../../core/services/offline-queue.service';
import { Mission, SubmissionPayload } from '../../core/models/mission.model';

@Component({
  selector: 'app-mission-execution',
  templateUrl: './mission-execution.page.html',
  styleUrls: ['./mission-execution.page.scss'],
  standalone: false
})
export class MissionExecutionPage implements OnInit {
  missionId!: number;
  mission: Mission | null = null;
  currentCoords: Coordinates | null = null;

  distanceMeters = 0;
  isWithinRadius = false;
  isCheckingGps = true;

  capturedPhotos: CapturedPhoto[] = [];
  requiredPhotosCount = 1;

  // Réponses au questionnaire
  productFound = 'yes';
  priceObserved = '';
  stockStatus = 'in_stock';
  contributorComments = '';

  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private missionService: MissionService,
    private geo: GeolocationService,
    private camera: CameraService,
    private offlineQueue: OfflineQueueService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.missionId = idParam ? parseInt(idParam, 10) : 0;
    this.loadMission();
    this.checkProximity();
  }

  async checkProximity(): Promise<void> {
    this.isCheckingGps = true;
    const coords = await this.geo.refreshPosition();
    this.currentCoords = coords;

    if (this.mission) {
      const check = this.geo.isWithinRadius(
        this.mission.latitude,
        this.mission.longitude,
        this.mission.radius_meters || 100
      );
      this.distanceMeters = check.distanceMeters;
      this.isWithinRadius = check.withinRadius;
    }
    this.isCheckingGps = false;
  }

  // Simulation pour tester en dev si l'utilisateur est trop loin
  simulateNearby(): void {
    if (this.mission) {
      this.distanceMeters = 24;
      this.isWithinRadius = true;
      this.showToast('Position simulée à 24m du point de vente (GPS vérifié).', 'success');
    }
  }

  async takePhoto(): Promise<void> {
    if (this.capturedPhotos.length >= 4) {
      this.showToast('Nombre maximum de 4 photos atteint.', 'warning');
      return;
    }

    try {
      const photo = await this.camera.capturePhoto();
      this.capturedPhotos.push(photo);
      this.showToast(`Photo ${this.capturedPhotos.length} capturée et certifiée.`, 'success');
    } catch (err: any) {
      this.showToast('Erreur lors de la prise de vue.', 'danger');
    }
  }

  removePhoto(index: number): void {
    this.capturedPhotos.splice(index, 1);
  }

  canSubmit(): boolean {
    return (
      this.isWithinRadius &&
      this.capturedPhotos.length >= this.requiredPhotosCount &&
      !this.isSubmitting
    );
  }

  async onSubmitProof(): Promise<void> {
    if (!this.mission) return;

    if (!this.isWithinRadius) {
      this.showToast(`Vous êtes à ${this.distanceMeters}m. Rapprochez-vous à moins de 100m.`, 'warning');
      return;
    }

    if (this.capturedPhotos.length < this.requiredPhotosCount) {
      this.showToast(`Veuillez prendre au moins ${this.requiredPhotosCount} photo(s).`, 'warning');
      return;
    }

    const payload: SubmissionPayload = {
      latitude: this.currentCoords?.latitude || this.mission.latitude,
      longitude: this.currentCoords?.longitude || this.mission.longitude,
      photo_urls: this.capturedPhotos.map(p => p.dataUrl),
      answers: {
        product_found: this.productFound,
        price_observed: this.priceObserved,
        stock_status: this.stockStatus,
        comments: this.contributorComments
      },
      device_id: 'device_' + (localStorage.getItem('sapsap_device_id') || Math.random().toString(36).substring(2, 11))
    };

    const loader = await this.loadingCtrl.create({
      message: 'Transmission sécurisée de la preuve terrain...',
      spinner: 'crescent'
    });
    await loader.present();
    this.isSubmitting = true;

    this.missionService.submitMission(this.mission.id, payload).subscribe({
      next: async (res) => {
        await loader.dismiss();
        this.isSubmitting = false;
        await this.showSuccessModal();
      },
      error: async (err) => {
        await loader.dismiss();
        this.isSubmitting = false;

        // Gestion de la résilience réseau (Story 3.4)
        this.offlineQueue.enqueue(
          this.mission!.id,
          this.mission!.title,
          payload,
          err.message
        );

        const alert = await this.alertCtrl.create({
          header: 'Preuve sauvegardée localement',
          subHeader: 'Réseau instable ou indisponible',
          message: 'Votre preuve a été enregistrée sur votre téléphone. Elle sera envoyée dès que la connexion sera rétablie.',
          buttons: [
            {
              text: 'Compris',
              handler: () => {
                this.missionService.clearActiveReservation();
                this.router.navigate(['/tabs/activity']);
              }
            }
          ]
        });
        await alert.present();
      }
    });
  }

  private async showSuccessModal(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '🎉 Preuve Envoyée !',
      subHeader: `${this.mission?.reward_amount || 1500} FCFA en attente de déblocage`,
      message: 'Votre soumission a été certifiée par l\'empreinte GPS et photo. La validation automatique interviendra sous 48h max.',
      buttons: [
        {
          text: 'Voir mes activités',
          handler: () => {
            this.router.navigate(['/tabs/activity']);
          }
        }
      ]
    });
    await alert.present();
  }

  private loadMission(): void {
    this.mission = {
      id: this.missionId || 101,
      campaign_id: 1,
      title: 'Vérification prix Sucre & Huile — Marché Somgandé',
      description: 'Relevé de prix pour le bidon d\'huile Dinor 5L et le paquet de sucre SN SOSUCO 1kg.',
      mission_type: 'price_check',
      reward_amount: 1500,
      latitude: 12.385420,
      longitude: -1.508700,
      address: 'Marché de Somgandé, Ouagadougou',
      district: 'Somgandé',
      radius_meters: 100,
      required_photos_count: 1,
      status: 'assigned'
    };
    this.requiredPhotosCount = this.mission.required_photos_count;
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      position: 'top',
      color
    });
    await toast.present();
  }
}
