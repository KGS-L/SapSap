import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit, OnDestroy {
  user: User | null = null;
  showEditModal = false;
  editForm!: FormGroup;
  private authSubscription: Subscription | null = null;

  ouagaDistricts: string[] = [
    'Somgandé',
    'Koulouba',
    'Gounghin',
    'Ouaga 2000',
    'Dassasgho',
    'Patte d\'Oie',
    'Tanghin',
    'Pissy',
    'Wayalghin',
    'Tampouy'
  ];

  constructor(
    public authService: AuthService,
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      firstName: ['', [Validators.maxLength(50)]],
      lastName: ['', [Validators.maxLength(50)]],
      district: ['Somgandé']
    });

    this.authSubscription = this.authService.currentUser$.subscribe(u => {
      this.user = u;
      if (u) {
        this.editForm.patchValue({
          firstName: u.first_name || (u.name ? u.name.split(' ')[0] : 'Contributeur'),
          lastName: u.last_name || (u.name ? u.name.split(' ').slice(1).join(' ') : 'SapSap'),
          district: u.district || 'Somgandé'
        });
      }
    });

    this.loadProfileFromApi();
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  loadProfileFromApi(): void {
    this.authService.getProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.user = res.data;
        }
      },
      error: () => {}
    });
  }

  openEditModal(): void {
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  async onSaveProfile(): Promise<void> {
    if (this.editForm.invalid) return;

    const val = this.editForm.value;
    const loader = await this.loadingCtrl.create({
      message: 'Mise à jour du profil...',
      spinner: 'crescent'
    });
    await loader.present();

    this.authService.updateProfile({
      first_name: val.firstName,
      last_name: val.lastName,
      name: `${val.firstName} ${val.lastName}`.trim(),
      district: val.district,
      city: 'Ouagadougou'
    }).subscribe({
      next: async (res) => {
        await loader.dismiss();
        this.closeEditModal();
        this.showToast('Profil mis à jour avec succès.', 'success');
      },
      error: async (err) => {
        await loader.dismiss();
        this.closeEditModal();
        // Mise à jour locale en dev si backend hors-ligne
        if (this.user) {
          this.user.first_name = val.firstName;
          this.user.last_name = val.lastName;
          this.user.name = `${val.firstName} ${val.lastName}`.trim();
          this.user.district = val.district;
        }
        this.showToast('Profil mis à jour en local.', 'success');
      }
    });
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Se déconnecter ?',
      message: 'Vous devrez saisir à nouveau votre numéro de téléphone pour vous reconnecter.',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Déconnexion',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
          }
        }
      ]
    });
    await alert.present();
  }

  getReputationTier(score: number): { label: string; class: string } {
    if (score >= 90) return { label: 'Contributeur Élite', class: 'badge-sage' };
    if (score >= 70) return { label: 'Contributeur Confirmé', class: 'badge-buttercream' };
    return { label: 'Contributeur Standard', class: 'badge-muted' };
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
