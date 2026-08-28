import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: false
})
export class AuthPage implements OnInit {
  step: 'phone' | 'otp' = 'phone';
  phoneForm!: FormGroup;
  otpForm!: FormGroup;
  isLoading = false;
  demoOtp = environment.demoOtp || '123456';
  submittedPhone = '';
  resendCountdown = 0;
  private timerInterval: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/tabs/explore']);
    }

    this.phoneForm = this.fb.group({
      phoneNumber: ['70000000', [Validators.required, Validators.pattern(/^[0-9\s]{8,15}$/)]]
    });

    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  async onRequestOtp(): Promise<void> {
    if (this.phoneForm.invalid) {
      this.showToast('Veuillez saisir un numéro de téléphone valide (8 chiffres).', 'warning');
      return;
    }

    const rawPhone = this.phoneForm.value.phoneNumber;
    this.submittedPhone = this.authService.normalizePhoneNumber(rawPhone);

    const loader = await this.loadingCtrl.create({
      message: 'Génération du code OTP...',
      spinner: 'crescent'
    });
    await loader.present();

    this.authService.requestOtp(this.submittedPhone).subscribe({
      next: async (res) => {
        await loader.dismiss();
        this.step = 'otp';
        this.startResendTimer();
        this.showToast(`Code OTP envoyé au ${this.submittedPhone}. (Démo: ${this.demoOtp})`, 'success');
      },
      error: async (err) => {
        await loader.dismiss();
        this.showToast(err.message || 'Impossible d\'envoyer le code OTP.', 'danger');
      }
    });
  }

  async onVerifyOtp(): Promise<void> {
    if (this.otpForm.invalid) {
      this.showToast('Le code OTP doit comporter 6 chiffres.', 'warning');
      return;
    }

    const otpCode = this.otpForm.value.otpCode;
    const loader = await this.loadingCtrl.create({
      message: 'Vérification en cours...',
      spinner: 'crescent'
    });
    await loader.present();

    this.authService.verifyOtp(this.submittedPhone, otpCode).subscribe({
      next: async (res) => {
        await loader.dismiss();
        await this.showToast('Connexion réussie ! Bienvenue sur SapSap.', 'success');
        this.router.navigate(['/tabs/explore']);
      },
      error: async (err) => {
        await loader.dismiss();
        this.showToast(err.message || 'Code OTP invalide ou expiré.', 'danger');
      }
    });
  }

  fillDemoOtp(): void {
    this.otpForm.patchValue({ otpCode: this.demoOtp });
  }

  backToPhone(): void {
    this.step = 'phone';
    this.otpForm.reset();
  }

  private startResendTimer(): void {
    this.resendCountdown = 60;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.resendCountdown > 0) {
        this.resendCountdown--;
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
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
