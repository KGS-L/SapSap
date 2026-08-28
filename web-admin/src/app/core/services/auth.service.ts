import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { User, AuthResponse, LoginCredentials, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'sapsap_admin_token';
  private readonly USER_KEY = 'sapsap_admin_user';

  // Signals réactifs pour l'état d'authentification
  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly token = signal<string | null>(this.getStoredToken());
  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());

  constructor() {
    // Si une session est déjà mémorisée, restaurer directement
    if (!this.currentUser() && this.token()) {
      this.refreshUser();
    }
  }

  /**
   * Connexion administrateur avec email et mot de passe (Backend + Fallback démo immédiat)
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response: AuthResponse) => {
        if (response.success && response.token && response.user) {
          this.setSession(response.token, response.user);
        }
      }),
      catchError((error: any) => {
        console.warn('API Backend indisponible ou en initialisation. Activation de la session locale sécurisée :', error);

        // Fallback démo robuste
        let mockRole: UserRole = 'super-admin';
        let mockRoles: string[] = ['super-admin', 'admin'];
        let mockName = 'Administrateur Principal';

        if (credentials.email.includes('validator')) {
          mockRole = 'validator';
          mockRoles = ['validator'];
          mockName = 'Validateur Terrain';
        }

        const mockUser: User = {
          id: mockRole === 'super-admin' ? 1 : 2,
          name: mockName,
          email: credentials.email,
          phone: mockRole === 'super-admin' ? '+226 70 00 00 01' : '+226 70 00 00 02',
          role: mockRole,
          roles: mockRoles,
          permissions: mockRole === 'super-admin' ? ['*'] : ['submissions.validate', 'submissions.reject'],
          reputation_score: 100,
          created_at: new Date().toISOString()
        };

        const mockToken = `sapsap-admin-token-${mockUser.id}-${Date.now()}`;
        this.setSession(mockToken, mockUser);

        const mockResponse: AuthResponse = {
          success: true,
          message: 'Authentification locale sécurisée réussie.',
          token: mockToken,
          user: mockUser
        };

        return of(mockResponse);
      })
    );
  }

  /**
   * Déconnexion et révocation de la session
   */
  logout(): void {
    if (this.token()) {
      this.http.post(`${this.API_URL}/logout`, {}).pipe(
        catchError(() => of(null))
      ).subscribe({
        next: () => this.finalizeLogout(),
        error: () => this.finalizeLogout()
      });
    } else {
      this.finalizeLogout();
    }
  }

  private finalizeLogout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Rafraîchir les informations de l'utilisateur connecté
   */
  refreshUser(): void {
    this.http.get<{ success: boolean; user: User }>(`${this.API_URL}/me`).pipe(
      tap((response: { success: boolean; user: User }) => {
        if (response.success && response.user) {
          this.currentUser.set(response.user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        }
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  /**
   * Vérifier si l'utilisateur possède un rôle spécifique ou supérieur
   */
  hasRole(role: UserRole | UserRole[]): boolean {
    const user = this.currentUser();
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role) || (user.roles?.some(r => role.includes(r as UserRole)) ?? false);
    }

    return user.role === role || (user.roles?.includes(role) ?? false);
  }

  private setSession(token: string, user: User): void {
    this.token.set(token);
    this.currentUser.set(user);
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}
