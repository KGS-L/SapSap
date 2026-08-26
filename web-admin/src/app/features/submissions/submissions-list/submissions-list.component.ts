import { Component } from '@angular/core';

@Component({
  selector: 'app-submissions-list',
  standalone: true,
  imports: [],
  templateUrl: './submissions-list.component.html',
  styleUrl: './submissions-list.component.css'
})
export class SubmissionsListComponent {
  submissions = [
    {
      id: 'SUB-894',
      contributor: 'Moussa Ouédraogo',
      phone: '+226 70 12 34 56',
      reputation: 96,
      mission: 'Audit Boutique Kiosque #42',
      campaign: 'Audit Présence PLV Sobbra',
      location: 'Secteur 15 (Patte d\'Oie), Ouagadougou',
      gpsDistance: 22, // meters
      gpsTolerance: 100,
      photosCount: 2,
      submittedAt: '26/08/2026 16:38',
      autoValidationDeadline: '28/08/2026 16:38 (dans 47h)',
      status: 'submitted',
      photoUrl: 'assets/sample-photo-1.jpg'
    },
    {
      id: 'SUB-893',
      contributor: 'Amina Sawadogo',
      phone: '+226 76 98 76 54',
      reputation: 92,
      mission: 'Relevé Prix Sobbra - Maquis Le Régal',
      campaign: 'Audit Présence PLV Sobbra',
      location: 'Secteur 28 (Dassasgho), Ouagadougou',
      gpsDistance: 45,
      gpsTolerance: 100,
      photosCount: 3,
      submittedAt: '26/08/2026 16:05',
      autoValidationDeadline: '28/08/2026 16:05 (dans 47h)',
      status: 'submitted',
      photoUrl: 'assets/sample-photo-2.jpg'
    },
    {
      id: 'SUB-892',
      contributor: 'Ibrahim Kaboré',
      phone: '+226 65 11 22 33',
      reputation: 64,
      mission: 'Contrôle Affiche Publicitaire',
      campaign: 'Relevé Prix Carburant Total / Shell',
      location: 'Secteur 12 (Gounghin), Ouagadougou',
      gpsDistance: 140, // > 100m => GPS anomaly alert!
      gpsTolerance: 100,
      photosCount: 1,
      submittedAt: '26/08/2026 15:40',
      autoValidationDeadline: '28/08/2026 15:40 (dans 46h)',
      status: 'fraud_suspect',
      photoUrl: 'assets/sample-photo-3.jpg'
    }
  ];
}
