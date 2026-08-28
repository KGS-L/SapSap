import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BusinessUser {
  id: number;
  name: string;
  email: string;
  company_name: string;
  role: 'company-admin' | 'company-viewer';
  city: string;
  avatar_url?: string;
  roles?: string[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      roles: string[];
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly STORAGE_KEY = 'sapsap_business_user';
  private readonly TOKEN_KEY = 'sapsap_business_token';

  readonly currentUser = signal<BusinessUser | null>(null);
  readonly token = signal<string | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser() && !!this.token());

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
        this.token.set(token);
        return;
      } catch (e) {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.TOKEN_KEY);
      }
    }

    // Utilisateur par défaut pour une navigation fluide
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
    const defaultToken = 'mock-token-sobbra-bf';
    this.currentUser.set(defaultUser);
    this.token.set(defaultToken);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultUser));
    localStorage.setItem(this.TOKEN_KEY, defaultToken);
  }

  /**
   * Connexion avec email et mot de passe (Backend Laravel Sanctum + Fallback)
   */
  login(credentials: { email: string; password: string }): Observable<boolean> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      map(res => {
        if (res.success && res.data) {
          const user: BusinessUser = {
            id: res.data.user.id,
            name: res.data.user.name,
            email: res.data.user.email,
            company_name: credentials.email.includes('orange') ? 'Orange Burkina SA' : 'Sobbra Distribution BF',
            role: 'company-admin',
            city: 'Ouagadougou',
            roles: res.data.user.roles,
            avatar_url: credentials.email.includes('orange') 
              ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
          };
          this.setSession(res.data.token, user);
          return true;
        }
        return false;
      }),
      catchError(err => {
        console.warn('Backend Auth indisponible ou identifiants mock, connexion en mode démo', err);
        // Fallback démo
        let user: BusinessUser;
        if (credentials.email.includes('orange')) {
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

        const token = `token-${user.id}-${Date.now()}`;
        this.setSession(token, user);
        return of(true);
      })
    );
  }

  logout(): void {
    if (this.token()) {
      this.http.post(`${this.API_URL}/logout`, {}).pipe(
        catchError(() => of(null))
      ).subscribe(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      });
    } else {
      this.clearSession();
      this.router.navigate(['/login']);
    }
  }

  private setSession(token: string, user: BusinessUser): void {
    this.token.set(token);
    this.currentUser.set(user);
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  private clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.token.set(null);
  }

  getToken(): string | null {
    return this.token() || localStorage.getItem(this.TOKEN_KEY);
  }
}
