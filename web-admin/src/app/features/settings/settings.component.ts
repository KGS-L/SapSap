import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  schedulerInterval = 'Toutes les heures';
  autoValidationDelayHours = 48;
  gpsToleranceMeters = 100;
  reservationLockMinutes = 45;
  minWithdrawalFcfa = 1000;
}
