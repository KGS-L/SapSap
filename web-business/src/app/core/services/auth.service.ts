import { Injectable, signal } from '@angular/core';

export interface BusinessUser {
  id: number;
  name: string;
  email: string;
  company_name: string;
  role: 'company-admin' | 'company-viewer';
  city: string;
  avatar_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'sapsap_business_user';
  private readonly TOKEN_KEY = 'sapsap_business_token';

  readonly currentUser = signal<BusinessUser | null>(null);
  readonly isAuthenticated = signal<boolean>(false);

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    const savedUser = localStorage.getItem(this.STORAGE_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        return;
      } catch (e) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }

    // Utilisateur par défaut pour expérience fluide
    this.setDefaultUser();
  }

  setDefaultUser(): void {
    const defaultUser: BusinessUser = {
      id: 3,
      name: 'Jean-Marc Somé',
      email: 'business@sobbra.bf',
      company_name: 'Sobbra Distribution BF',
      role: 'company-admin',
      city: 'Ouagadougou',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    };
    this.currentUser.set(defaultUser);
    this.isAuthenticated.set(true);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultUser));
    localStorage.setItem(this.TOKEN_KEY, 'mock-token-sobbra-bf');
  }

  login(email: string): boolean {
    let user: BusinessUser;

    if (email.includes('orange')) {
      user = {
        id: 4,
        name: 'Directeur Réseau Orange',
        email: 'business@orange.bf',
        company_name: 'Orange Burkina SA',
        role: 'company-admin',
        city: 'Ouagadougou',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      };
    } else {
      user = {
        id: 3,
        name: 'Jean-Marc Somé',
        email: 'business@sobbra.bf',
        company_name: 'Sobbra Distribution BF',
        role: 'company-admin',
        city: 'Ouagadougou',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      };
    }

    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(this.TOKEN_KEY, `mock-token-${user.id}`);
    return true;
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
