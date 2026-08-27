import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Campaign, CampaignCounts, CampaignListResponse, CampaignDetailResponse } from '../models/campaign.model';
import { AdminStatsService } from './admin-stats.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CampaignAdminService {
  private readonly http = inject(HttpClient);
  private readonly adminStatsService = inject(AdminStatsService);

  private readonly API_URL = `${environment.apiUrl}/admin/campaigns`;

  readonly campaigns = signal<Campaign[]>([]);
  readonly counts = signal<CampaignCounts>({ total: 0, pending: 0, active: 0, rejected: 0 });
  readonly isLoading = signal<boolean>(false);
  readonly selectedCampaign = signal<Campaign | null>(null);

  /**
   * Charger les campagnes depuis l'API avec filtre optionnel
   */
  loadCampaigns(status: string = 'all'): Observable<CampaignListResponse> {
    this.isLoading.set(true);
    const url = status === 'all' ? this.API_URL : `${this.API_URL}?status=${status}`;

    return this.http.get<CampaignListResponse>(url).pipe(
      tap((response: CampaignListResponse) => {
        this.isLoading.set(false);
        if (response.success) {
          this.campaigns.set(response.data);
          this.counts.set(response.counts);

          // Synchroniser le badge du header et de la sidebar
          this.adminStatsService.updateStats({
            pendingCampaigns: response.counts.pending
          });
        }
      }),
      catchError((error: any) => {
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Approuver une campagne et la publier sur la marketplace
   */
  approveCampaign(id: number): Observable<CampaignDetailResponse> {
    return this.http.post<CampaignDetailResponse>(`${this.API_URL}/${id}/approve`, {}).pipe(
      tap((response: CampaignDetailResponse) => {
        if (response.success) {
          this.loadCampaigns().subscribe();
        }
      })
    );
  }

  /**
   * Rejeter une campagne avec un motif
   */
  rejectCampaign(id: number, reason: string): Observable<CampaignDetailResponse> {
    return this.http.post<CampaignDetailResponse>(`${this.API_URL}/${id}/reject`, { reason }).pipe(
      tap((response: CampaignDetailResponse) => {
        if (response.success) {
          this.loadCampaigns().subscribe();
        }
      })
    );
  }

  /**
   * Obtenir les détails d'une campagne
   */
  getCampaignDetails(id: number): Observable<CampaignDetailResponse> {
    return this.http.get<CampaignDetailResponse>(`${this.API_URL}/${id}`).pipe(
      tap((response: CampaignDetailResponse) => {
        if (response.success) {
          this.selectedCampaign.set(response.data);
        }
      })
    );
  }
}
