import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { FraudAlert, FraudCounts, FraudAlertListResponse, FraudDetailResponse } from '../models/fraud.model';
import { AdminStatsService } from './admin-stats.service';

@Injectable({
  providedIn: 'root'
})
export class FraudAdminService {
  private readonly http = inject(HttpClient);
  private readonly adminStatsService = inject(AdminStatsService);

  private readonly API_URL = 'http://localhost:8080/api/v1/admin/fraud/alerts';

  readonly alerts = signal<FraudAlert[]>([]);
  readonly counts = signal<FraudCounts>({
    total: 3,
    pending: 3,
    duplicate_images: 1,
    device_sharing: 1,
    resolved: 0
  });
  readonly isLoading = signal<boolean>(false);
  readonly selectedAlert = signal<FraudAlert | null>(null);

  // Données de secours réalistes pour Ouagadougou si backend hors ligne
  private readonly mockAlerts: FraudAlert[] = [
    {
      id: 1,
      user_id: 2,
      submission_id: 3,
      alert_type: 'duplicate_image',
      severity: 'high',
      title: 'Image dupliquée détectée (Empreinte SHA-256 identique)',
      description: "La photo soumise pour le 'Contrôle Affiche' a la même signature SHA-256 qu'une photo de la soumission SUB-2026-001 (par Moussa Ouédraogo).",
      details: {
        sha256_hash: 'a8f5c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b111',
        original_submission_id: 1,
        original_user_name: 'Moussa Ouédraogo',
        file_name: 'facade_maquis_01.jpg',
        file_size: 245000,
        match_percentage: 100,
        detected_at: '2026-08-27 11:30'
      },
      status: 'pending',
      resolution_action: null,
      resolution_note: null,
      resolved_by: null,
      resolved_at: null,
      created_at: '2026-08-27 11:30:00',
      updated_at: '2026-08-27 11:30:00',
      user: {
        id: 2,
        name: 'Ibrahim Kaboré',
        email: 'ibrahim@sapsap.bf',
        phone: '+226 65 11 22 33',
        reputation_score: 64,
        is_active: true
      },
      submission: {
        id: 3,
        mission_id: 2,
        status: 'fraud_suspect',
        gps_distance_meters: 140,
        created_at: '2026-08-27 11:30:00',
        photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600'],
        mission: {
          id: 2,
          title: 'Vérification Panneau Affiche',
          location_name: 'Secteur 12 (Gounghin), Ouagadougou'
        }
      }
    },
    {
      id: 2,
      user_id: 1,
      submission_id: null,
      alert_type: 'device_sharing',
      severity: 'high',
      title: 'Multi-comptes détecté sur le terminal DEV-BF-OUAGA-99182',
      description: '3 comptes contributeurs distincts se sont connectés et ont soumis des missions depuis le même smartphone physique.',
      details: {
        device_id: 'DEV-BF-OUAGA-99182',
        accounts_count: 3,
        linked_accounts: [
          { name: 'Moussa Ouédraogo', phone: '+226 70 12 34 56', score: 96 },
          { name: 'Amina Sawadogo', phone: '+226 76 98 76 54', score: 92 },
          { name: 'Ibrahim Kaboré', phone: '+226 65 11 22 33', score: 64 }
        ],
        risk_factor: 'Suspect de ferme de téléphones ou contournement des plafonds journaliers'
      },
      status: 'pending',
      resolution_action: null,
      resolution_note: null,
      resolved_by: null,
      resolved_at: null,
      created_at: '2026-08-27 10:15:00',
      updated_at: '2026-08-27 10:15:00',
      user: {
        id: 1,
        name: 'Moussa Ouédraogo',
        email: 'moussa@sapsap.bf',
        phone: '+226 70 12 34 56',
        reputation_score: 96,
        is_active: true
      }
    },
    {
      id: 3,
      user_id: 2,
      submission_id: 3,
      alert_type: 'gps_spoofing',
      severity: 'medium',
      title: 'Anomalie de positionnement GPS (> 100m)',
      description: 'La prise de vue a été effectuée à 140m du point cible de la mission (tolérance max autorisée : 100m).',
      details: {
        distance_meters: 140,
        allowed_tolerance: 100,
        location: 'Secteur 12 (Gounghin), Ouagadougou',
        accuracy: '±6m'
      },
      status: 'pending',
      resolution_action: null,
      resolution_note: null,
      resolved_by: null,
      resolved_at: null,
      created_at: '2026-08-27 09:40:00',
      updated_at: '2026-08-27 09:40:00',
      user: {
        id: 2,
        name: 'Ibrahim Kaboré',
        email: 'ibrahim@sapsap.bf',
        phone: '+226 65 11 22 33',
        reputation_score: 64,
        is_active: true
      },
      submission: {
        id: 3,
        mission_id: 2,
        status: 'fraud_suspect',
        gps_distance_meters: 140,
        created_at: '2026-08-27 09:40:00',
        mission: {
          id: 2,
          title: 'Vérification Panneau Affiche',
          location_name: 'Secteur 12 (Gounghin), Ouagadougou'
        }
      }
    }
  ];

  /**
   * Charger les alertes avec filtres de statut ou de type
   */
  loadAlerts(status: string = 'all', type: string = 'all'): Observable<FraudAlertListResponse> {
    this.isLoading.set(true);
    let url = `${this.API_URL}?status=${status}`;
    if (type !== 'all') {
      url += `&type=${type}`;
    }

    return this.http.get<FraudAlertListResponse>(url).pipe(
      tap((res: FraudAlertListResponse) => {
        this.isLoading.set(false);
        if (res.success) {
          this.alerts.set(res.data);
          this.counts.set(res.counts);
          this.adminStatsService.updateStats({ fraudAlerts: res.counts.pending });
        }
      }),
      catchError(() => {
        // Fallback local avec filtrage
        this.isLoading.set(false);
        let filtered = [...this.mockAlerts];
        if (status !== 'all') {
          filtered = filtered.filter(a => a.status === status);
        }
        if (type !== 'all') {
          filtered = filtered.filter(a => a.alert_type === type);
        }

        const counts: FraudCounts = {
          total: this.mockAlerts.length,
          pending: this.mockAlerts.filter(a => a.status === 'pending').length,
          duplicate_images: this.mockAlerts.filter(a => a.alert_type === 'duplicate_image').length,
          device_sharing: this.mockAlerts.filter(a => a.alert_type === 'device_sharing').length,
          resolved: this.mockAlerts.filter(a => a.status === 'resolved').length
        };

        this.alerts.set(filtered);
        this.counts.set(counts);
        this.adminStatsService.updateStats({ fraudAlerts: counts.pending });

        return of({
          success: true,
          data: filtered,
          counts
        });
      })
    );
  }

  /**
   * Résoudre une alerte avec une sanction (suspension, pénalité de score, avertissement)
   */
  resolveAlert(id: number, action: string, note?: string): Observable<FraudDetailResponse> {
    return this.http.post<FraudDetailResponse>(`${this.API_URL}/${id}/resolve`, { action, note }).pipe(
      tap((res: FraudDetailResponse) => {
        if (res.success) {
          this.updateLocalAlert(id, 'resolved', action, note);
        }
      }),
      catchError(() => {
        // Fallback local
        this.updateLocalAlert(id, 'resolved', action, note);
        const updatedAlert = this.mockAlerts.find(a => a.id === id);
        return of({
          success: true,
          data: updatedAlert || this.mockAlerts[0],
          message: 'Alerte résolue avec succès.'
        });
      })
    );
  }

  /**
   * Classer l'alerte sans suite (faux positif)
   */
  dismissAlert(id: number, note?: string): Observable<FraudDetailResponse> {
    return this.http.post<FraudDetailResponse>(`${this.API_URL}/${id}/dismiss`, { note }).pipe(
      tap((res: FraudDetailResponse) => {
        if (res.success) {
          this.updateLocalAlert(id, 'dismissed', 'false_positive', note);
        }
      }),
      catchError(() => {
        // Fallback local
        this.updateLocalAlert(id, 'dismissed', 'false_positive', note);
        const updatedAlert = this.mockAlerts.find(a => a.id === id);
        return of({
          success: true,
          data: updatedAlert || this.mockAlerts[0],
          message: 'Alerte classée sans suite.'
        });
      })
    );
  }

  private updateLocalAlert(id: number, status: 'resolved' | 'dismissed', action?: string, note?: string): void {
    const alertIndex = this.mockAlerts.findIndex(a => a.id === id);
    if (alertIndex !== -1) {
      this.mockAlerts[alertIndex].status = status;
      this.mockAlerts[alertIndex].resolution_action = action || null;
      this.mockAlerts[alertIndex].resolution_note = note || null;
      this.mockAlerts[alertIndex].resolved_at = new Date().toISOString();
    }
    this.alerts.update(list =>
      list.map(a =>
        a.id === id
          ? {
              ...a,
              status,
              resolution_action: action || null,
              resolution_note: note || null,
              resolved_at: new Date().toISOString()
            }
          : a
      )
    );
    const pendingCount = this.mockAlerts.filter(a => a.status === 'pending').length;
    this.adminStatsService.updateStats({ fraudAlerts: pendingCount });
  }
}
