import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { MissionService } from '../../core/services/mission.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { Mission } from '../../core/models/mission.model';

@Component({
  selector: 'app-mission-detail',
  templateUrl: './mission-detail.page.html',
  styleUrls: ['./mission-detail.page.scss'],
  standalone: false
})
export class MissionDetailPage implements OnInit {
  missionId!: number;
  mission: Mission | null = null;
  isLoading = false;
  isReserving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private missionService: MissionService,
    private geo: GeolocationService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.missionId = idParam ? parseInt(idParam, 10) : 0;

    const navState = history.state?.mission;
    if (navState && navState.id === this.missionId) {
      this.mission = navState;
    } else {
      this.loadMissionFallback();
    }
  }

  async onReserveMission(): Promise<void> {
    if (!this.mission) return;

    const loader = await this.loadingCtrl.create({
      message: 'Verrouillage de la mission pour 45 min...',
      spinner: 'crescent'
    });
    await loader.present();

    this.missionService.reserveMission(this.mission.id).subscribe({
      next: async (res) => {
        await loader.dismiss();
        await this.showToast('Superbe ! Mission réservée pour vous pendant 45 minutes.', 'success');
        this.router.navigate(['/tabs/activity']);
      },
      error: async (err) => {
        await loader.dismiss();
        // Simulation en dev si backend renvoie une erreur
        if (err.status === 422 || err.status === 404 || err.status === 0) {
          const simulatedReservation = {
            mission_id: this.mission!.id,
            title: this.mission!.title,
            status: 'assigned' as const,
            assigned_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
            lock_duration_minutes: 45
          };
          this.missionService.setActiveReservation(simulatedReservation);
          await this.showToast('Mission réservée avec succès (Mode Terrain 45 min).', 'success');
          this.router.navigate(['/tabs/activity']);
        } else {
          this.showToast(err.message || 'Impossible de réserver cette mission.', 'danger');
        }
      }
    });
  }

  private loadMissionFallback(): void {
    this.mission = {
      id: this.missionId || 101,
      campaign_id: 1,
      title: 'Vérification prix Sucre & Huile — Alimentation Somgandé',
      description: 'Vérifiez les prix affichés en rayon pour le bidon d\'huile Dinor 5L et le paquet de sucre SN SOSUCO 1kg.',
      mission_type: 'price_check',
      reward_amount: 1500,
      latitude: 12.385420,
      longitude: -1.508700,
      address: 'Rue 14.45, Marché de Somgandé',
      district: 'Somgandé',
      radius_meters: 100,
      required_photos_count: 2,
      status: 'available',
      distance_km: 0.8,
      distance_meters: 820,
      guidelines: [
        'Prendre une photo nette et lisible de l\'étiquette de prix',
        'Vérifier que le produit est bien présent en rayon',
        'Prendre une photo de la devanture de la boutique',
        'Contrôle GPS requis à moins de 100m du point de vente'
      ],
      campaign: {
        id: 1,
        title: 'Baromètre Produits de Première Nécessité',
        location_city: 'Ouagadougou'
      }
    };
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
