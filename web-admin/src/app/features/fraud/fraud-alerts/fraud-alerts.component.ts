import { Component } from '@angular/core';

@Component({
  selector: 'app-fraud-alerts',
  standalone: true,
  imports: [],
  templateUrl: './fraud-alerts.component.html',
  styleUrl: './fraud-alerts.component.css'
})
export class FraudAlertsComponent {
  fraudAlerts = [
    {
      id: 'FRD-102',
      type: 'sha256_duplicate',
      title: 'Empreinte SHA-256 identique détectée',
      severity: 'high',
      contributor: 'Salif Sanogo (+226 70 88 99 00)',
      targetMission: 'Audit Maquis Secteur 14',
      originalMission: 'Audit Maquis Secteur 9 (il y a 3 jours)',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      detectedAt: '26/08/2026 15:10',
      actionTaken: 'Soumission bloquée automatiquement'
    },
    {
      id: 'FRD-101',
      type: 'multi_account_device',
      title: 'Multi-comptes sur un même Device ID',
      severity: 'medium',
      contributor: '3 comptes associés à l\'appareil #AND-99482-BF',
      targetMission: 'Multiples réservations de missions',
      originalMission: 'Comptes : +226 71 00 11 22, +226 72 00 11 22, +226 73 00 11 22',
      sha256: 'N/A (Device Fingerprint ID)',
      detectedAt: '26/08/2026 12:45',
      actionTaken: 'Alerte administrateur levée'
    },
    {
      id: 'FRD-100',
      type: 'gps_spoofing',
      title: 'Vitesse de déplacement anormale (Téléportation GPS)',
      severity: 'high',
      contributor: 'Kader Traoré (+226 60 44 55 66)',
      targetMission: 'Relevé Panneau Billboard Somgandé',
      originalMission: 'Mission précédente à Tampouy (18km en 3 minutes)',
      sha256: 'N/A (Analyse télémétrie GPS)',
      detectedAt: '25/08/2026 18:20',
      actionTaken: 'Compte suspendu temporairement pour vérification'
    }
  ];
}
