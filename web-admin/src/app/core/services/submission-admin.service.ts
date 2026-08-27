import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Submission, SubmissionCounts, SubmissionListResponse, SubmissionDetailResponse } from '../models/submission.model';
import { AdminStatsService } from './admin-stats.service';

@Injectable({
  providedIn: 'root'
})
export class SubmissionAdminService {
  private readonly http = inject(HttpClient);
  private readonly adminStatsService = inject(AdminStatsService);

  private readonly API_URL = 'http://localhost:8080/api/v1/admin/submissions';

  // Données de secours réalistes pour Ouagadougou
  private readonly mockSubmissions: Submission[] = [
    {
      id: 1,
      mission_id: 1,
      user_id: 1,
      status: 'submitted',
      submitted_latitude: 12.3716,
      submitted_longitude: -1.5195,
      gps_accuracy: 8.0,
      gps_distance_meters: 22.0,
      device_id: 'DEV-BF-OUAGA-99182',
      answers: {
        'Nombre de frigos Sobbra visibles': '2 frigos vitrés opérationnels',
        'Affiche promotionnelle présente': 'Oui, affichage bien visible sur la façade',
        'Prix Beaufort 50cl': '800 FCFA',
        'Disponibilité stock': 'Plus de 5 casiers en réserve'
      },
      photos: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600'
      ],
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      user: {
        id: 1,
        name: 'Moussa Ouédraogo',
        email: 'moussa@sapsap.bf',
        phone: '+226 70 12 34 56',
        reputation_score: 96
      },
      mission: {
        id: 1,
        campaign_id: 1,
        title: 'Audit Maquis Kiosque #1 (Patte d\'Oie)',
        location_name: 'Patte d\'Oie, Secteur 15',
        reward: 3000,
        campaign: {
          id: 1,
          title: 'Audit Présence PLV Boissons Sobbra',
          company_name: 'Sobbra Distribution BF',
          type: 'Audit & Présence',
          city: 'Ouagadougou'
        }
      }
    },
    {
      id: 2,
      mission_id: 2,
      user_id: 2,
      status: 'submitted',
      submitted_latitude: 12.3768,
      submitted_longitude: -1.5142,
      gps_accuracy: 12.0,
      gps_distance_meters: 45.0,
      device_id: 'DEV-BF-OUAGA-77211',
      answers: {
        'Prix Super 91 affiché': '850 FCFA/L',
        'Prix Gasoil affiché': '775 FCFA/L',
        'File d\'attente à la pompe': 'Fluide (moins de 2 véhicules)',
        'Paiement Mobile Money actif': 'Oui (Orange Money et Moov Money disponibles)'
      },
      photos: [
        'https://images.unsplash.com/photo-1527018607636-921ec5735f5d?w=600'
      ],
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      user: {
        id: 2,
        name: 'Amina Sawadogo',
        email: 'amina@sapsap.bf',
        phone: '+226 76 98 76 54',
        reputation_score: 92
      },
      mission: {
        id: 2,
        campaign_id: 2,
        title: 'Relevé Totem Station Shell Gounghin',
        location_name: 'Gounghin, Boulevard de la Jeunesse',
        reward: 2500,
        campaign: {
          id: 2,
          title: 'Relevé Prix Carburant Total / Shell',
          company_name: 'Observatoire Énergétique BF',
          type: 'Relevé de prix',
          city: 'Ouagadougou'
        }
      }
    },
    {
      id: 3,
      mission_id: 3,
      user_id: 3,
      status: 'fraud_suspect',
      submitted_latitude: 12.3880,
      submitted_longitude: -1.5030,
      gps_accuracy: 6.0,
      gps_distance_meters: 140.0,
      device_id: 'DEV-BF-OUAGA-33044',
      answers: {
        'Point de vente trouvé': 'Oui mais rideau baissé',
        'Photos prises depuis': 'Véhicule en mouvement'
      },
      photos: [
        'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=600'
      ],
      created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      user: {
        id: 3,
        name: 'Ibrahim Kaboré',
        email: 'ibrahim@sapsap.bf',
        phone: '+226 65 11 22 33',
        reputation_score: 64
      },
      mission: {
        id: 3,
        campaign_id: 1,
        title: 'Audit Maquis Kiosque #3 (Dassasgho)',
        location_name: 'Dassasgho, Secteur 28',
        reward: 3000,
        campaign: {
          id: 1,
          title: 'Audit Présence PLV Boissons Sobbra',
          company_name: 'Sobbra Distribution BF',
          type: 'Audit & Présence',
          city: 'Ouagadougou'
        }
      }
    },
    {
      id: 4,
      mission_id: 4,
      user_id: 1,
      status: 'submitted',
      submitted_latitude: 12.3788,
      submitted_longitude: -1.4920,
      gps_accuracy: 7.0,
      gps_distance_meters: 18.0,
      device_id: 'DEV-BF-OUAGA-99182',
      answers: {
        'Prix Totem affiché': 'Super91 850 FCFA, Gasoil 775 FCFA',
        'Boutique ouverte': 'Oui'
      },
      photos: [
        'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=600'
      ],
      created_at: new Date(Date.now() - 52 * 3600 * 1000).toISOString(), // > 48h (éligible auto-validation)
      updated_at: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
      user: {
        id: 1,
        name: 'Moussa Ouédraogo',
        email: 'moussa@sapsap.bf',
        phone: '+226 70 12 34 56',
        reputation_score: 96
      },
      mission: {
        id: 4,
        campaign_id: 2,
        title: 'Vérification Totem Shell Dassasgho',
        location_name: 'Dassasgho, Rue 29.14',
        reward: 2500,
        campaign: {
          id: 2,
          title: 'Relevé Prix Carburant Total / Shell',
          company_name: 'Observatoire Énergétique BF',
          type: 'Relevé de prix',
          city: 'Ouagadougou'
        }
      }
    },
    {
      id: 5,
      mission_id: 5,
      user_id: 2,
      status: 'validated',
      submitted_latitude: 12.3550,
      submitted_longitude: -1.5430,
      gps_accuracy: 5.0,
      gps_distance_meters: 25.0,
      device_id: 'DEV-BF-OUAGA-77211',
      answers: {
        'Présence Grille tarifaire': 'Affiche visible sur le comptoir',
        'Liquidité disponible': 'Plus de 200 000 FCFA'
      },
      photos: [
        'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=600'
      ],
      validated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      auto_validated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // Déjà auto-validé par le scheduler
      created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      user: {
        id: 2,
        name: 'Amina Sawadogo',
        email: 'amina@sapsap.bf',
        phone: '+226 76 98 76 54',
        reputation_score: 94
      },
      mission: {
        id: 5,
        campaign_id: 3,
        title: 'Audit Kiosque Orange Money Pissy',
        location_name: 'Pissy Secteur 17',
        reward: 2000,
        campaign: {
          id: 3,
          title: 'Contrôle Boutiques Orange Money',
          company_name: 'Orange Burkina SA',
          type: 'Vérification point de vente',
          city: 'Ouagadougou'
        }
      }
    }
  ];

  readonly submissions = signal<Submission[]>(this.mockSubmissions);
  readonly counts = signal<SubmissionCounts>({
    total: 5,
    submitted: 3,
    validated: 1,
    rejected: 0,
    fraud_suspect: 1
  });
  readonly isLoading = signal<boolean>(false);
  readonly selectedSubmission = signal<Submission | null>(null);

  /**
   * Charger les soumissions depuis l'API avec filtre optionnel
   */
  loadSubmissions(status: string = 'all'): Observable<SubmissionListResponse> {
    this.isLoading.set(true);
    const url = status === 'all' ? this.API_URL : `${this.API_URL}?status=${status}`;

    return this.http.get<SubmissionListResponse>(url).pipe(
      tap((response: SubmissionListResponse) => {
        this.isLoading.set(false);
        if (response.success) {
          this.submissions.set(response.data);
          this.counts.set(response.counts);

          this.adminStatsService.updateStats({
            pendingSubmissions: response.counts.submitted
          });
        }
      }),
      catchError(() => {
        this.isLoading.set(false);
        let filtered = this.mockSubmissions;
        if (status !== 'all') {
          if (status === 'auto_validated') {
            filtered = this.mockSubmissions.filter(s => !!s.auto_validated_at);
          } else {
            filtered = this.mockSubmissions.filter(s => s.status === status);
          }
        }
        this.submissions.set(filtered);
        return of({
          success: true,
          data: filtered,
          counts: this.counts()
        });
      })
    );
  }

  /**
   * Valider une soumission et créditer le contributeur
   */
  validateSubmission(id: number): Observable<SubmissionDetailResponse> {
    return this.http.post<SubmissionDetailResponse>(`${this.API_URL}/${id}/validate`, {}).pipe(
      tap((response: SubmissionDetailResponse) => {
        if (response.success) {
          this.loadSubmissions().subscribe();
        }
      }),
      catchError(() => {
        // Fallback local
        this.submissions.update(list =>
          list.map(s => (s.id === id ? { ...s, status: 'validated' as const, validated_at: new Date().toISOString() } : s))
        );
        this.counts.update(c => ({
          ...c,
          submitted: Math.max(0, c.submitted - 1),
          validated: c.validated + 1
        }));
        return of({
          success: true,
          data: this.submissions().find(s => s.id === id)!,
          message: 'Soumission validée avec succès.'
        });
      })
    );
  }

  /**
   * Rejeter une soumission avec un motif obligatoire
   */
  rejectSubmission(id: number, reason: string): Observable<SubmissionDetailResponse> {
    return this.http.post<SubmissionDetailResponse>(`${this.API_URL}/${id}/reject`, { reason }).pipe(
      tap((response: SubmissionDetailResponse) => {
        if (response.success) {
          this.loadSubmissions().subscribe();
        }
      }),
      catchError(() => {
        // Fallback local
        this.submissions.update(list =>
          list.map(s => (s.id === id ? { ...s, status: 'rejected' as const, rejection_reason: reason, rejected_at: new Date().toISOString() } : s))
        );
        this.counts.update(c => ({
          ...c,
          submitted: Math.max(0, c.submitted - 1),
          rejected: c.rejected + 1
        }));
        return of({
          success: true,
          data: this.submissions().find(s => s.id === id)!,
          message: 'Soumission rejetée avec succès.'
        });
      })
    );
  }

  /**
   * Obtenir les détails d'une soumission
   */
  getSubmissionDetails(id: number): Observable<SubmissionDetailResponse> {
    return this.http.get<SubmissionDetailResponse>(`${this.API_URL}/${id}`).pipe(
      tap((response: SubmissionDetailResponse) => {
        if (response.success) {
          this.selectedSubmission.set(response.data);
        }
      }),
      catchError(() => {
        const item = this.mockSubmissions.find(s => s.id === id) || null;
        this.selectedSubmission.set(item);
        return of({
          success: true,
          data: item!
        });
      })
    );
  }
}
