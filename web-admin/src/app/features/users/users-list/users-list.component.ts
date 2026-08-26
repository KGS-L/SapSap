import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent {
  users = [
    {
      id: 'USR-001',
      name: 'Ousmane Traoré',
      email: 'admin@sapsap.bf',
      phone: '+226 70 01 02 03',
      role: 'super-admin',
      roleLabel: 'Super Administrateur',
      status: 'active',
      lastLogin: 'Il y a 5 min'
    },
    {
      id: 'USR-002',
      name: 'Fatimata Zongo',
      email: 'mod1@sapsap.bf',
      phone: '+226 76 11 22 33',
      role: 'validator',
      roleLabel: 'Validateur Terrain',
      status: 'active',
      lastLogin: 'Il y a 2h'
    },
    {
      id: 'USR-003',
      name: 'Jean-Marc Somé',
      email: 'contact@sobbra-bf.com',
      phone: '+226 78 44 55 66',
      role: 'company-admin',
      roleLabel: 'Admin Entreprise (Sobbra)',
      status: 'active',
      lastLogin: 'Hier à 17:00'
    }
  ];
}
