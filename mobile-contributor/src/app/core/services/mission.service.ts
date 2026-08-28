import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/auth.model';
import {
  Mission,
  ReservationResponse,
  SubmissionPayload,
  SubmissionResponse,
  SubmissionItem
} from '../models/mission.model';
import { GeolocationService } from './geolocation.service';

@Injectable({
  providedIn: 'root'
})
export class MissionService {
  private readonly ACTIVE_RESERVATION_KEY = 'sapsap_active_reservation';
  private readonly SUBMISSIONS_CACHE_KEY = 'sapsap_submissions_cache';

  private activeReservationSubject = new BehaviorSubject<ReservationResponse | null>(null);
  public activeReservation$ = this.activeReservationSubject.asObservable();

  private submissionsSubject = new BehaviorSubject<SubmissionItem[]>([]);
  public submissions$ = this.submissionsSubject.asObservable();

  constructor(
    private api: ApiService,
    private geo: GeolocationService
  ) {
    this.loadStoredReservation();
    this.loadStoredSubmissions();
  }

  private loadStoredReservation(): void {
    const raw = localStorage.getItem(this.ACTIVE_RESERVATION_KEY);
    if (raw) {
      try {
        const parsed: ReservationResponse = JSON.parse(raw);
        const expiresAt = new Date(parsed.expires_at).getTime();
        if (expiresAt > Date.now()) {
          this.activeReservationSubject.next(parsed);
        } else {
          this.clearActiveReservation();
        }
      } catch {
        this.clearActiveReservation();
      }
    }
  }

  private loadStoredSubmissions(): void {
    const raw = localStorage.getItem(this.SUBMISSIONS_CACHE_KEY);
    if (raw) {
      try {
        this.submissionsSubject.next(JSON.parse(raw));
      } catch {
        this.submissionsSubject.next([]);
      }
    }
  }

  /**
   * Récupérer les missions disponibles géolocalisées autour du contributeur
   */
  public getAvailableMissions(lat?: number, lng?: number): Observable<ApiResponse<Mission[]>> {
    const coords = this.geo.getCurrentCoordinates();
    const queryLat = lat ?? coords.latitude;
    const queryLng = lng ?? coords.longitude;

    return this.api.get<Mission[]>('/missions', { lat: queryLat, lng: queryLng }).pipe(
      map(res => {
        if (res.success && Array.isArray(res.data)) {
          // Enrichir avec calculs de distance dynamiques et quartiers
          res.data = res.data.map(m => {
            const distMeters = this.geo.calculateDistanceMeters(
              queryLat,
              queryLng,
              m.latitude,
              m.longitude
            );
            return {
              ...m,
              distance_meters: distMeters,
              distance_km: Math.round((distMeters / 1000) * 10) / 10,
              district: m.district || this.guessDistrict(m.latitude, m.longitude)
            };
          });
        }
        return res;
      })
    );
  }

  /**
   * Réserver une mission pour 45 minutes
   */
  public reserveMission(missionId: number): Observable<ApiResponse<ReservationResponse>> {
    return this.api.post<ReservationResponse>(`/missions/${missionId}/reserve`, {}).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setActiveReservation(res.data);
        }
      })
    );
  }

  /**
   * Annuler la réservation en cours
   */
  public cancelReservation(missionId: number): Observable<ApiResponse<null>> {
    return this.api.post<null>(`/missions/${missionId}/cancel-reservation`, {}).pipe(
      tap(res => {
        if (res.success) {
          this.clearActiveReservation();
        }
      })
    );
  }

  /**
   * Soumettre une mission avec preuves photo et réponses
   */
  public submitMission(
    missionId: number,
    payload: SubmissionPayload
  ): Observable<ApiResponse<SubmissionResponse>> {
    return this.api.post<SubmissionResponse>(`/missions/${missionId}/submit`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.clearActiveReservation();
          this.recordSubmission({
            id: res.data.submission_id,
            mission_id: missionId,
            status: 'pending_review',
            submitted_at: new Date().toISOString(),
            distance_from_target_meters: res.data.distance_from_target_meters,
            photos_count: payload.photo_urls.length,
            auto_validation_deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
          });
        }
      })
    );
  }

  public setActiveReservation(res: ReservationResponse): void {
    localStorage.setItem(this.ACTIVE_RESERVATION_KEY, JSON.stringify(res));
    this.activeReservationSubject.next(res);
  }

  public clearActiveReservation(): void {
    localStorage.removeItem(this.ACTIVE_RESERVATION_KEY);
    this.activeReservationSubject.next(null);
  }

  public getActiveReservationValue(): ReservationResponse | null {
    return this.activeReservationSubject.value;
  }

  private recordSubmission(item: SubmissionItem): void {
    const list = [item, ...this.submissionsSubject.value];
    this.submissionsSubject.next(list);
    localStorage.setItem(this.SUBMISSIONS_CACHE_KEY, JSON.stringify(list));
  }

  private guessDistrict(lat: number, lng: number): string {
    // Quartiers typiques de Ouagadougou selon les coordonnées
    if (lat > 12.38) return 'Somgandé / Tanghin';
    if (lat < 12.35) return 'Ouaga 2000 / Patte d\'Oie';
    if (lng > -1.50) return 'Dassasgho / Wayalghin';
    if (lng < -1.54) return 'Gounghin / Pissy';
    return 'Koulouba / Centre-Ville';
  }
}
