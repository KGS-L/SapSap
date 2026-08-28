import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-settings.component.html',
  styleUrl: './company-settings.component.css'
})
export class CompanySettingsComponent {
  readonly authService = inject(AuthService);

  activeTab = signal<'profile' | 'billing' | 'notifications' | 'api'>('profile');
  toastMessage = signal<string | null>(null);

  // Profile fields
  companyName = signal<string>('Sobbra Distribution BF');
  managerName = signal<string>('Jean-Marc Somé');
  email = signal<string>('business@sobbra.bf');
  phone = signal<string>('+226 25 30 60 70');
  city = signal<string>('Ouagadougou');
  address = signal<string>('Avenue de la Nation, Secteur 4');
  nif = signal<string>('0001245896B');
  rccm = signal<string>('BF-OUA-2018-B-1425');

  // Billing
  defaultMobileMoney = signal<string>('+22670123456');
  defaultProvider = signal<'orange' | 'moov'>('orange');
  autoRecharge = signal<boolean>(false);

  // Notifications
  notifyOnSubmission = signal<boolean>(true);
  notifyOnAutoValidation = signal<boolean>(true);
  notifyOnLowBudget = signal<boolean>(true);
  dailyDigest = signal<boolean>(false);

  // API Token
  apiKey = signal<string>('sapsap_live_sk_89f3a9e4b2d1c0e7f6a5b4c3');
  showKey = signal<boolean>(false);

  saveProfile(): void {
    this.showToast('Informations de l\'entreprise mises à jour avec succès !');
  }

  saveBilling(): void {
    this.showToast('Paramètres de facturation et Mobile Money enregistrés !');
  }

  saveNotifications(): void {
    this.showToast('Préférences de notifications enregistrées !');
  }

  regenerateApiKey(): void {
    this.apiKey.set(`sapsap_live_sk_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`);
    this.showToast('Nouvelle clé API générée avec succès.');
  }

  copyApiKey(): void {
    navigator.clipboard.writeText(this.apiKey());
    this.showToast('Clé API copiée dans le presse-papier !');
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
