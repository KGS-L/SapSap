import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse, AuthResponse, User } from '../models/auth.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'sapsap_token';
  private readonly USER_KEY = 'sapsap_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private api: ApiService,
    private router: Router
  ) {
    this.loadStoredSession();
  }

  private loadStoredSession(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
      } catch {
        this.clearSession();
      }
    }
  }

  public get isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  public get currentToken(): string | null {
    return this.tokenSubject.value;
  }

  public get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Normaliser le numéro de téléphone au format E.164 burkinabè (+226...)
   */
  public normalizePhoneNumber(phone: string): string {
    let clean = phone.replace(/[\s\-\(\)]/g, '');
    if (clean.startsWith('00226')) {
      clean = '+' + clean.substring(2);
    } else if (clean.startsWith('226')) {
      clean = '+' + clean;
    } else if (!clean.startsWith('+226')) {
      clean = '+226' + clean;
    }
    return clean;
  }

  /**
   * Demande de génération et envoi de code OTP
   */
  requestOtp(phoneNumber: string): Observable<ApiResponse<{ phone_number: string }>> {
    const formattedPhone = this.normalizePhoneNumber(phoneNumber);
    return this.api.post<{ phone_number: string }>('/auth/mobile/request-otp', {
      phone_number: formattedPhone
    });
  }

  /**
   * Vérification du code OTP et authentification Sanctum
   */
  verifyOtp(phoneNumber: string, otpCode: string): Observable<ApiResponse<AuthResponse>> {
    const formattedPhone = this.normalizePhoneNumber(phoneNumber);
    return this.api.post<AuthResponse>('/auth/mobile/verify-otp', {
      phone_number: formattedPhone,
      otp_code: otpCode.trim()
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data.token, {
            id: response.data.user.id,
            name: response.data.user.name,
            phone_number: response.data.user.phone_number,
            reputation_score: response.data.user.reputation_score || 100,
            city: 'Ouagadougou',
            roles: ['contributor']
          });
        }
      })
    );
  }

  /**
   * Récupérer le profil utilisateur depuis le backend
   */
  getProfile(): Observable<ApiResponse<User>> {
    return this.api.get<User>('/profile').pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateLocalUser(response.data);
        }
      })
    );
  }

  /**
   * Mettre à jour le profil (nom, prénom, quartier)
   */
  updateProfile(profileData: Partial<User>): Observable<ApiResponse<User>> {
    return this.api.put<User>('/profile', profileData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.updateLocalUser(response.data);
        }
      })
    );
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
  }

  private updateLocalUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  /**
   * Déconnexion utilisateur
   */
  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth']);
  }
}
