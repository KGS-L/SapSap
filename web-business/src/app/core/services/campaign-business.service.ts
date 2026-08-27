import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Campaign, CampaignStats, ResultPoint, TrackingData } from '../models/campaign.model';

@Injectable({
  providedIn: 'root'
})
export class CampaignBusinessService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8000/api/v1/business';

  // État réactif
  readonly campaigns = signal<Campaign[]>([]);
  readonly stats = signal<CampaignStats | null>(null);
  readonly currentTracking = signal<TrackingData | null>(null);
  readonly currentResultsMap = signal<ResultPoint[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Charger toutes les campagnes de l'entreprise
   */
  loadCampaigns(): Observable<{ success: boolean; data: Campaign[]; stats: CampaignStats }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<{ success: boolean; data: Campaign[]; stats: CampaignStats }>(`${this.apiUrl}/campaigns`).pipe(
      tap(res => {
        this.campaigns.set(res.data);
        this.stats.set(res.stats);
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.warn('Backend indisponible ou erreur, utilisation des données de démonstration', err);
        const fallback = this.getMockCampaigns();
        this.campaigns.set(fallback.data);
        this.stats.set(fallback.stats);
        this.isLoading.set(false);
        return of(fallback);
      })
    );
  }

  /**
   * Charger les données de suivi temps réel pour une campagne (Story 5.2)
   */
  loadTracking(campaignId: number): Observable<{ success: boolean; data: TrackingData }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<{ success: boolean; data: TrackingData }>(`${this.apiUrl}/campaigns/${campaignId}/tracking`).pipe(
      tap(res => {
        this.currentTracking.set(res.data);
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.warn('Backend indisponible pour le tracking, utilisation des données de démonstration', err);
        const mockTracking = this.getMockTracking(campaignId);
        this.currentTracking.set(mockTracking.data);
        this.isLoading.set(false);
        return of(mockTracking);
      })
    );
  }

  /**
   * Charger la carte des résultats et points d'inspection (Story 5.2)
   */
  loadResultsMap(campaignId: number): Observable<{ success: boolean; data: ResultPoint[] }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<{ success: boolean; data: ResultPoint[] }>(`${this.apiUrl}/campaigns/${campaignId}/results-map`).pipe(
      tap(res => {
        this.currentResultsMap.set(res.data);
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.warn('Backend indisponible pour la carte, utilisation des données de démonstration', err);
        const mockMap = this.getMockResultsMap(campaignId);
        this.currentResultsMap.set(mockMap.data);
        this.isLoading.set(false);
        return of(mockMap);
      })
    );
  }

  /**
   * Télécharger l'exportation des données de campagne (Story 5.3)
   */
  exportCampaignData(campaignId: number, format: 'csv' | 'excel' = 'csv', filters?: { status?: string; neighborhood?: string }): Observable<Blob> {
    let params: any = {};
    if (filters?.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters?.neighborhood && filters.neighborhood !== 'all') {
      params.neighborhood = filters.neighborhood;
    }

    const endpoint = `${this.apiUrl}/campaigns/${campaignId}/export/${format}`;
    return this.http.get(endpoint, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Déclencher le téléchargement direct avec gestion automatique de fallback client
   */
  downloadCampaignExport(campaignId: number, format: 'csv' | 'excel' = 'csv', filters?: { status?: string; neighborhood?: string }): Observable<boolean> {
    return this.exportCampaignData(campaignId, format, filters).pipe(
      tap(blob => {
        const dateStr = new Date().toISOString().slice(0, 10);
        const ext = format === 'csv' ? 'csv' : 'xls';
        const filename = `sapsap-campagne-${campaignId}-export-${dateStr}.${ext}`;
        this.triggerBlobDownload(blob, filename);
      }),
      map(() => true),
      catchError(err => {
        console.warn('Export backend non joignable, génération client en cours...', err);
        this.generateAndDownloadClientExport(campaignId, format, filters);
        return of(true);
      })
    );
  }

  /**
   * Génération de l'exportation côté client (Mode Démonstration / Offline)
   */
  generateAndDownloadClientExport(campaignId: number, format: 'csv' | 'excel' = 'csv', filters?: { status?: string; neighborhood?: string }): void {
    const rawMap = this.currentResultsMap().length > 0 ? this.currentResultsMap() : this.getMockResultsMap(campaignId).data;
    let points = [...rawMap];

    if (filters?.status && filters.status !== 'all') {
      points = points.filter(p => p.status === filters.status);
    }
    if (filters?.neighborhood && filters.neighborhood !== 'all') {
      points = points.filter(p => p.location_name.toLowerCase().includes(filters.neighborhood!.toLowerCase()));
    }

    const headers = [
      'ID Mission',
      'Titre Mission',
      'Campagne',
      'Lieu / Quartier',
      'Latitude Cible',
      'Longitude Cible',
      'Statut Mission',
      'Rémunération (FCFA)',
      'Contributeur',
      'Score Réputation',
      'Date Soumission',
      'Date Validation',
      'Latitude GPS Réelle',
      'Longitude GPS Réelle',
      'Précision GPS',
      'Écart GPS Cible',
      'Réponses au Questionnaire',
      'Photographies Terrain'
    ];

    const rows = points.map(p => {
      const sub = p.submission;
      let answersStr = '';
      if (sub?.answers) {
        answersStr = Object.entries(sub.answers).map(([k, v]) => `${k}: ${v}`).join(' | ');
      }
      const photosStr = sub?.photos ? sub.photos.join(', ') : '';

      return [
        p.id,
        p.title,
        p.campaign_title,
        p.location_name,
        p.latitude,
        p.longitude,
        p.status === 'validated' ? 'Validée' : (p.status === 'submitted' ? 'En attente' : (p.status === 'reserved' ? 'En cours' : 'Disponible')),
        p.reward,
        sub?.contributor?.name || p.assigned_user?.name || 'N/A',
        sub?.contributor?.reputation_score ? `${sub.contributor.reputation_score}/100` : 'N/A',
        sub?.created_at || 'N/A',
        sub?.validated_at || 'N/A',
        sub?.submitted_latitude || 'N/A',
        sub?.submitted_longitude || 'N/A',
        sub?.gps_accuracy ? `${sub.gps_accuracy} m` : 'N/A',
        sub?.gps_distance_meters !== undefined ? `${sub.gps_distance_meters} m` : 'N/A',
        answersStr || 'Aucune réponse',
        photosStr || 'Aucune photo'
      ];
    });

    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      const csvLines = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      ];
      // BOM UTF-8 (\uFEFF)
      const csvContent = '\uFEFF' + csvLines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this.triggerBlobDownload(blob, `sapsap-campagne-${campaignId}-export-${dateStr}.csv`);
    } else {
      // Excel XML Spreadsheet 2003
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11" ss:FontName="Segoe UI"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Default">
   <Font ss:Color="#111827" ss:Size="10" ss:FontName="Segoe UI"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Résultats SapSap">
  <Table>
   <Row ss:Height="24">
    ${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${this.escapeXml(h)}</Data></Cell>`).join('')}
   </Row>
   ${rows.map(row => `
   <Row ss:Height="20">
    ${row.map(cell => `<Cell ss:StyleID="Default"><Data ss:Type="${typeof cell === 'number' ? 'Number' : 'String'}">${this.escapeXml(String(cell))}</Data></Cell>`).join('')}
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;
      const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      this.triggerBlobDownload(blob, `sapsap-campagne-${campaignId}-export-${dateStr}.xls`);
    }
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  private triggerBlobDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // =========================================================================
  // Données de Démonstration Réalistes pour Ouagadougou (Story 5.2)
  // =========================================================================

  private getMockCampaigns(): { success: boolean; data: Campaign[]; stats: CampaignStats } {
    const data: Campaign[] = [
      {
        id: 1,
        title: 'Audit Présence PLV Boissons Sobbra Ouagadougou',
        company_name: 'Sobbra Distribution BF',
        description: 'Contrôle visuel des affiches, de la disponibilité des boissons et de la mise en avant des réfrigérateurs Sobbra dans les débits de boissons et maquis à Ouagadougou.',
        type: 'Audit & Présence',
        city: 'Ouagadougou',
        target_neighborhoods: 'Patte d\'Oie, Dassasgho, Gounghin, Tampouy, Ouaga 2000, Pissy, Kamsonghin, Somgandé',
        criteria: 'Photo façade + Photo frigo + Questionnaire 4 questions',
        missions_count: 20,
        reward_per_mission: 2500,
        total_budget: 50000,
        status: 'active',
        approved_at: '2026-08-24T10:00:00Z',
        created_at: '2026-08-24T08:30:00Z',
        completed_missions: 14,
        submitted_missions: 3,
        reserved_missions: 2,
        available_missions: 1,
        progress_percent: 70,
        spent_budget: 35000,
        remaining_budget: 15000
      },
      {
        id: 2,
        title: 'Contrôle Kiosques & Boutiques Orange Money',
        company_name: 'Orange Burkina SA',
        description: 'Vérification de la conformité des affichages tarifaires et de la disponibilité du cash in/cash out dans les agences de proximité.',
        type: 'Vérification point de vente',
        city: 'Ouagadougou',
        target_neighborhoods: 'Ouaga 2000, Patte d\'Oie, Gounghin, Kamsonghin',
        criteria: 'Photo façade + Photo grille tarifaire + Test liquidité',
        missions_count: 50,
        reward_per_mission: 2000,
        total_budget: 100000,
        status: 'active',
        approved_at: '2026-08-26T14:00:00Z',
        created_at: '2026-08-26T09:15:00Z',
        completed_missions: 32,
        submitted_missions: 6,
        reserved_missions: 5,
        available_missions: 7,
        progress_percent: 64,
        spent_budget: 64000,
        remaining_budget: 36000
      },
      {
        id: 3,
        title: 'Relevé Prix Carburant Stations Service Total & Shell',
        company_name: 'Observatoire Énergétique BF',
        description: 'Relevé des prix affichés sur les totems des stations-service à Ouagadougou et vérification de la disponibilité du Super 91 et Gasoil.',
        type: 'Relevé de prix',
        city: 'Ouagadougou & Périphérie',
        target_neighborhoods: 'Zone du Bois, Somgandé, Pissy',
        criteria: 'Photo totem tarifaire + Saisie prix Super91 et Gasoil',
        missions_count: 60,
        reward_per_mission: 2500,
        total_budget: 150000,
        status: 'pending',
        created_at: '2026-08-27T08:00:00Z',
        completed_missions: 0,
        submitted_missions: 0,
        reserved_missions: 0,
        available_missions: 60,
        progress_percent: 0,
        spent_budget: 0,
        remaining_budget: 150000
      }
    ];

    const stats: CampaignStats = {
      total_campaigns: 3,
      active_campaigns: 2,
      total_missions_target: 130,
      total_missions_completed: 46,
      total_budget_allocated: 300000,
      total_budget_spent: 99000
    };

    return { success: true, data, stats };
  }

  private getMockTracking(campaignId: number): { success: boolean; data: TrackingData } {
    const tracking: TrackingData = {
      campaign: {
        id: campaignId,
        title: 'Audit Présence PLV Boissons Sobbra Ouagadougou',
        company_name: 'Sobbra Distribution BF',
        description: 'Contrôle visuel des affiches, de la disponibilité des boissons et de la mise en avant des réfrigérateurs Sobbra dans les débits de boissons et maquis à Ouagadougou.',
        type: 'Audit & Présence',
        city: 'Ouagadougou',
        target_neighborhoods: 'Patte d\'Oie, Dassasgho, Gounghin, Tampouy, Ouaga 2000, Pissy, Kamsonghin, Somgandé',
        missions_count: 20,
        reward_per_mission: 2500,
        total_budget: 50000,
        status: 'active',
        approved_at: '2026-08-24T10:00:00Z',
        created_at: '2026-08-24T08:30:00Z'
      },
      metrics: {
        total_missions: 20,
        completed_missions: 14,
        submitted_missions: 3,
        reserved_missions: 2,
        available_missions: 1,
        progress_percent: 70,
        spent_budget: 35000,
        escrow_remaining: 15000,
        average_gps_accuracy_m: 18.5,
        compliance_rate_percent: 98
      },
      neighborhood_stats: [
        { neighborhood: 'Patte d\'Oie', total_points: 3, completed_points: 2, progress_percent: 67 },
        { neighborhood: 'Dassasgho', total_points: 3, completed_points: 2, progress_percent: 67 },
        { neighborhood: 'Gounghin', total_points: 3, completed_points: 2, progress_percent: 67 },
        { neighborhood: 'Tampouy', total_points: 3, completed_points: 2, progress_percent: 67 },
        { neighborhood: 'Ouaga 2000', total_points: 3, completed_points: 3, progress_percent: 100 },
        { neighborhood: 'Pissy', total_points: 2, completed_points: 1, progress_percent: 50 },
        { neighborhood: 'Kamsonghin', total_points: 1, completed_points: 1, progress_percent: 100 },
        { neighborhood: 'Somgandé', total_points: 1, completed_points: 0, progress_percent: 0 },
        { neighborhood: 'Zone du Bois', total_points: 1, completed_points: 0, progress_percent: 0 }
      ],
      recent_activity: [
        {
          id: 101,
          mission_id: 13,
          mission_title: 'Lounge VIP Prestige — Ouaga 2000',
          location_name: 'Ouaga 2000, Boulevard Mouammar Kadhafi',
          contributor_name: 'Moussa Ouédraogo',
          contributor_score: 96,
          status: 'validated',
          gps_distance_meters: 12.0,
          created_at: '2026-08-27T13:45:00Z',
          validated_at: '2026-08-27T13:50:00Z',
          photos_count: 2
        },
        {
          id: 102,
          mission_id: 4,
          mission_title: 'Bar Restaurant Le Faso — Dassasgho',
          location_name: 'Dassasgho, Rue 29.14',
          contributor_name: 'Amina Sawadogo',
          contributor_score: 94,
          status: 'validated',
          gps_distance_meters: 18.0,
          created_at: '2026-08-27T12:10:00Z',
          validated_at: '2026-08-27T12:25:00Z',
          photos_count: 2
        },
        {
          id: 103,
          mission_id: 3,
          mission_title: 'Espace Culturel Le Baron — Patte d\'Oie',
          location_name: 'Patte d\'Oie Boulevard',
          contributor_name: 'Ibrahim Kaboré',
          contributor_score: 88,
          status: 'submitted',
          gps_distance_meters: 22.0,
          created_at: '2026-08-27T11:30:00Z',
          photos_count: 2
        },
        {
          id: 104,
          mission_id: 1,
          mission_title: 'Maquis Le Régal — Patte d\'Oie',
          location_name: 'Patte d\'Oie, Face échangeur',
          contributor_name: 'Moussa Ouédraogo',
          contributor_score: 96,
          status: 'validated',
          gps_distance_meters: 15.0,
          created_at: '2026-08-27T10:15:00Z',
          validated_at: '2026-08-27T10:30:00Z',
          photos_count: 2
        }
      ]
    };

    return { success: true, data: tracking };
  }

  private getMockResultsMap(campaignId: number): { success: boolean; data: ResultPoint[] } {
    const photoFrigo = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800';
    const photoFacade = 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800';
    const photoStock = 'https://images.unsplash.com/photo-1527018607636-921ec5735f5d?w=800';
    const photoBoutique = 'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=800';

    const points: ResultPoint[] = [
      // 1. Patte d'Oie
      {
        id: 1,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Maquis Le Régal — Patte d\'Oie',
        location_name: 'Patte d\'Oie, Face échangeur',
        latitude: 12.3325,
        longitude: -1.5120,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 },
        submission: {
          id: 201,
          status: 'validated',
          submitted_latitude: 12.3326,
          submitted_longitude: -1.5121,
          gps_accuracy: 5.5,
          gps_distance_meters: 15.0,
          answers: {
            'Affiches publicitaires visibles': 'Oui, grande bâche PLV Sobbra bien visible en façade',
            'Frigos Sobbra opérationnels': '2 réfrigérateurs vitrés connectés et frais',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': 'Plus de 10 casiers en réserve'
          },
          photos: [photoFacade, photoFrigo],
          created_at: '2026-08-27T10:15:00Z',
          validated_at: '2026-08-27T10:30:00Z',
          contributor: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 }
        }
      },
      {
        id: 2,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Kiosque Chez Tanti — Patte d\'Oie',
        location_name: 'Patte d\'Oie Secteur 15',
        latitude: 12.3350,
        longitude: -1.5080,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 },
        submission: {
          id: 202,
          status: 'validated',
          submitted_latitude: 12.3351,
          submitted_longitude: -1.5081,
          gps_accuracy: 6.0,
          gps_distance_meters: 14.2,
          answers: {
            'Affiches publicitaires visibles': 'Oui, poster comptoir présent',
            'Frigos Sobbra opérationnels': '1 frigo opérationnel',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': '4 casiers'
          },
          photos: [photoFrigo, photoStock],
          created_at: '2026-08-27T09:40:00Z',
          validated_at: '2026-08-27T10:00:00Z',
          contributor: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 }
        }
      },
      {
        id: 3,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Espace Culturel Le Baron — Patte d\'Oie',
        location_name: 'Patte d\'Oie Boulevard',
        latitude: 12.3380,
        longitude: -1.5160,
        reward: 2500,
        status: 'submitted',
        assigned_user: { id: 3, name: 'Ibrahim Kaboré', reputation_score: 88 },
        submission: {
          id: 203,
          status: 'submitted',
          submitted_latitude: 12.3382,
          submitted_longitude: -1.5159,
          gps_accuracy: 7.5,
          gps_distance_meters: 22.0,
          answers: {
            'Affiches publicitaires visibles': 'Oui, enseigne lumineuse en place',
            'Frigos Sobbra opérationnels': '3 frigos en salle',
            'Prix Beaufort Lager 50cl': '850 FCFA',
            'Disponibilité stock': '8 casiers'
          },
          photos: [photoFacade, photoFrigo],
          created_at: '2026-08-27T11:30:00Z',
          contributor: { id: 3, name: 'Ibrahim Kaboré', reputation_score: 88 }
        }
      },

      // 2. Dassasgho
      {
        id: 4,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Bar Restaurant Le Faso — Dassasgho',
        location_name: 'Dassasgho, Rue 29.14',
        latitude: 12.3789,
        longitude: -1.4921,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 },
        submission: {
          id: 204,
          status: 'validated',
          submitted_latitude: 12.3788,
          submitted_longitude: -1.4920,
          gps_accuracy: 6.8,
          gps_distance_meters: 18.0,
          answers: {
            'Affiches publicitaires visibles': 'Oui, stickers sur chaque table',
            'Frigos Sobbra opérationnels': '2 frigos pleins',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': 'Plus de 15 casiers'
          },
          photos: [photoFacade, photoStock],
          created_at: '2026-08-27T12:10:00Z',
          validated_at: '2026-08-27T12:25:00Z',
          contributor: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 }
        }
      },
      {
        id: 5,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Maquis Les Champions — Dassasgho',
        location_name: 'Dassasgho Marché',
        latitude: 12.3810,
        longitude: -1.4890,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 },
        submission: {
          id: 205,
          status: 'validated',
          submitted_latitude: 12.3811,
          submitted_longitude: -1.4891,
          gps_accuracy: 4.5,
          gps_distance_meters: 12.4,
          answers: {
            'Affiches publicitaires visibles': 'Oui, parasols de marque Sobbra',
            'Frigos Sobbra opérationnels': '1 grand frigo double porte',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': '6 casiers'
          },
          photos: [photoFrigo, photoBoutique],
          created_at: '2026-08-27T08:50:00Z',
          validated_at: '2026-08-27T09:10:00Z',
          contributor: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 }
        }
      },
      {
        id: 6,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Alimentation Générale Wend-Kuni — Dassasgho',
        location_name: 'Dassasgho Nord',
        latitude: 12.3840,
        longitude: -1.4950,
        reward: 2500,
        status: 'submitted',
        assigned_user: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 },
        submission: {
          id: 206,
          status: 'submitted',
          submitted_latitude: 12.3842,
          submitted_longitude: -1.4949,
          gps_accuracy: 8.2,
          gps_distance_meters: 25.0,
          answers: {
            'Affiches publicitaires visibles': 'Oui, affiche sur la vitrine',
            'Frigos Sobbra opérationnels': '1 frigo branché',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': '5 casiers'
          },
          photos: [photoBoutique, photoStock],
          created_at: '2026-08-27T13:15:00Z',
          contributor: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 }
        }
      },

      // 3. Gounghin
      {
        id: 7,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Maquis Plein Air — Gounghin',
        location_name: 'Gounghin Nord, Avenue Kadiogo',
        latitude: 12.3580,
        longitude: -1.5420,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 },
        submission: {
          id: 207,
          status: 'validated',
          submitted_latitude: 12.3581,
          submitted_longitude: -1.5421,
          gps_accuracy: 5.0,
          gps_distance_meters: 14.5,
          answers: {
            'Affiches publicitaires visibles': 'Oui, banderole extérieure et posters',
            'Frigos Sobbra opérationnels': '2 frigos fonctionnels',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': '12 casiers'
          },
          photos: [photoFacade, photoFrigo],
          created_at: '2026-08-27T09:20:00Z',
          validated_at: '2026-08-27T09:45:00Z',
          contributor: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 }
        }
      },
      {
        id: 8,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Kiosque Sobbra Fraîcheur — Gounghin',
        location_name: 'Gounghin Sud',
        latitude: 12.3520,
        longitude: -1.5480,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 },
        submission: {
          id: 208,
          status: 'validated',
          submitted_latitude: 12.3521,
          submitted_longitude: -1.5482,
          gps_accuracy: 7.0,
          gps_distance_meters: 19.0,
          answers: {
            'Affiches publicitaires visibles': 'Oui, peinture murale Sobbra officielle',
            'Frigos Sobbra opérationnels': '1 frigo en service',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': '7 casiers'
          },
          photos: [photoFacade, photoStock],
          created_at: '2026-08-27T10:50:00Z',
          validated_at: '2026-08-27T11:15:00Z',
          contributor: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 }
        }
      },
      {
        id: 9,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Débit de Boisson La Paix — Gounghin',
        location_name: 'Gounghin Secteur 9',
        latitude: 12.3610,
        longitude: -1.5390,
        reward: 2500,
        status: 'reserved',
        assigned_user: { id: 3, name: 'Ibrahim Kaboré', reputation_score: 88 }
      },

      // 4. Tampouy
      {
        id: 10,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Bar Étoile du Nord — Tampouy',
        location_name: 'Tampouy, Grand Marché',
        latitude: 12.4020,
        longitude: -1.5510,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 },
        submission: {
          id: 210,
          status: 'validated',
          submitted_latitude: 12.4021,
          submitted_longitude: -1.5512,
          gps_accuracy: 6.2,
          gps_distance_meters: 16.8,
          answers: {
            'Affiches publicitaires visibles': 'Oui, enseigne lumineuse extérieure',
            'Frigos Sobbra opérationnels': '2 frigos vitrés',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': '10 casiers'
          },
          photos: [photoFrigo, photoFacade],
          created_at: '2026-08-27T11:00:00Z',
          validated_at: '2026-08-27T11:30:00Z',
          contributor: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 }
        }
      },
      {
        id: 11,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Maquis La Détente — Tampouy',
        location_name: 'Tampouy Secteur 22',
        latitude: 12.4080,
        longitude: -1.5460,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 },
        submission: {
          id: 211,
          status: 'validated',
          submitted_latitude: 12.4081,
          submitted_longitude: -1.5461,
          gps_accuracy: 5.8,
          gps_distance_meters: 13.5,
          answers: {
            'Affiches publicitaires visibles': 'Oui, parasols Sobbra',
            'Frigos Sobbra opérationnels': '1 frigo grand modèle',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': '6 casiers'
          },
          photos: [photoFacade, photoStock],
          created_at: '2026-08-27T08:30:00Z',
          validated_at: '2026-08-27T08:55:00Z',
          contributor: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 }
        }
      },
      {
        id: 12,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Kiosque Oasis — Tampouy',
        location_name: 'Tampouy Ouest',
        latitude: 12.4120,
        longitude: -1.5580,
        reward: 2500,
        status: 'submitted',
        assigned_user: { id: 3, name: 'Ibrahim Kaboré', reputation_score: 88 },
        submission: {
          id: 212,
          status: 'submitted',
          submitted_latitude: 12.4123,
          submitted_longitude: -1.5579,
          gps_accuracy: 9.0,
          gps_distance_meters: 30.0,
          answers: {
            'Affiches publicitaires visibles': 'Oui, poster au comptoir',
            'Frigos Sobbra opérationnels': '1 frigo',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': '4 casiers'
          },
          photos: [photoFrigo, photoBoutique],
          created_at: '2026-08-27T13:40:00Z',
          contributor: { id: 3, name: 'Ibrahim Kaboré', reputation_score: 88 }
        }
      },

      // 5. Ouaga 2000
      {
        id: 13,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Lounge VIP Prestige — Ouaga 2000',
        location_name: 'Ouaga 2000, Boulevard Mouammar Kadhafi',
        latitude: 12.3080,
        longitude: -1.5050,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 },
        submission: {
          id: 213,
          status: 'validated',
          submitted_latitude: 12.3081,
          submitted_longitude: -1.5051,
          gps_accuracy: 4.8,
          gps_distance_meters: 12.0,
          answers: {
            'Affiches publicitaires visibles': 'Oui, affichage digital et menu soigné',
            'Frigos Sobbra opérationnels': '3 frigos premium',
            'Prix Beaufort Lager 50cl': '1 000 FCFA',
            'Disponibilité stock': 'Plus de 20 casiers'
          },
          photos: [photoFacade, photoFrigo],
          created_at: '2026-08-27T13:45:00Z',
          validated_at: '2026-08-27T13:50:00Z',
          contributor: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 }
        }
      },
      {
        id: 14,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Café des Ambassades — Ouaga 2000',
        location_name: 'Ouaga 2000 Zone Ambassades',
        latitude: 12.3120,
        longitude: -1.4980,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 },
        submission: {
          id: 214,
          status: 'validated',
          submitted_latitude: 12.3121,
          submitted_longitude: -1.4981,
          gps_accuracy: 5.2,
          gps_distance_meters: 14.0,
          answers: {
            'Affiches publicitaires visibles': 'Oui, présentoir bar de qualité',
            'Frigos Sobbra opérationnels': '2 frigos branchés',
            'Prix Beaufort Lager 50cl': '1 000 FCFA',
            'Disponibilité stock': '15 casiers'
          },
          photos: [photoBoutique, photoStock],
          created_at: '2026-08-27T11:20:00Z',
          validated_at: '2026-08-27T11:40:00Z',
          contributor: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 }
        }
      },
      {
        id: 15,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Espace Gastronomique Le Palmier — Ouaga 2000',
        location_name: 'Ouaga 2000 Sud',
        latitude: 12.3020,
        longitude: -1.5120,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 },
        submission: {
          id: 215,
          status: 'validated',
          submitted_latitude: 12.3021,
          submitted_longitude: -1.5121,
          gps_accuracy: 4.2,
          gps_distance_meters: 11.0,
          answers: {
            'Affiches publicitaires visibles': 'Oui, bâche rétro-éclairée',
            'Frigos Sobbra opérationnels': '2 frigos inox',
            'Prix Beaufort Lager 50cl': '1 000 FCFA',
            'Disponibilité stock': '12 casiers'
          },
          photos: [photoFacade, photoStock],
          created_at: '2026-08-27T12:00:00Z',
          validated_at: '2026-08-27T12:20:00Z',
          contributor: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 }
        }
      },

      // 6. Pissy
      {
        id: 16,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Maquis de l\'Espoir — Pissy',
        location_name: 'Pissy Secteur 17',
        latitude: 12.3551,
        longitude: -1.5432,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 },
        submission: {
          id: 216,
          status: 'validated',
          submitted_latitude: 12.3550,
          submitted_longitude: -1.5430,
          gps_accuracy: 5.0,
          gps_distance_meters: 25.0,
          answers: {
            'Affiches publicitaires visibles': 'Oui, poster comptoir',
            'Frigos Sobbra opérationnels': '1 frigo opérationnel',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': '5 casiers'
          },
          photos: [photoFrigo, photoBoutique],
          created_at: '2026-08-27T08:15:00Z',
          validated_at: '2026-08-27T08:40:00Z',
          contributor: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 }
        }
      },
      {
        id: 17,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Kiosque Rafraîchissement — Pissy',
        location_name: 'Pissy Carrefour',
        latitude: 12.3590,
        longitude: -1.5490,
        reward: 2500,
        status: 'submitted',
        assigned_user: { id: 3, name: 'Ibrahim Kaboré', reputation_score: 88 },
        submission: {
          id: 217,
          status: 'submitted',
          submitted_latitude: 12.3592,
          submitted_longitude: -1.5489,
          gps_accuracy: 7.8,
          gps_distance_meters: 24.5,
          answers: {
            'Affiches publicitaires visibles': 'Oui, autocollant porte',
            'Frigos Sobbra opérationnels': '1 frigo',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': '3 casiers'
          },
          photos: [photoStock, photoFacade],
          created_at: '2026-08-27T13:55:00Z',
          contributor: { id: 3, name: 'Ibrahim Kaboré', reputation_score: 88 }
        }
      },

      // 7. Kamsonghin, Somgandé & Zone du Bois
      {
        id: 18,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Bar Central — Kamsonghin',
        location_name: 'Kamsonghin Centre',
        latitude: 12.3650,
        longitude: -1.5280,
        reward: 2500,
        status: 'validated',
        assigned_user: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 },
        submission: {
          id: 218,
          status: 'validated',
          submitted_latitude: 12.3651,
          submitted_longitude: -1.5281,
          gps_accuracy: 6.0,
          gps_distance_meters: 15.2,
          answers: {
            'Affiches publicitaires visibles': 'Oui, peinture et fanions',
            'Frigos Sobbra opérationnels': '2 frigos fonctionnels',
            'Prix Beaufort Lager 50cl': '800 FCFA',
            'Disponibilité stock': '8 casiers'
          },
          photos: [photoFacade, photoFrigo],
          created_at: '2026-08-27T09:00:00Z',
          validated_at: '2026-08-27T09:20:00Z',
          contributor: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 }
        }
      },
      {
        id: 19,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Maquis Le Baobab — Somgandé',
        location_name: 'Somgandé Zone Industrielle',
        latitude: 12.3950,
        longitude: -1.4880,
        reward: 2500,
        status: 'reserved',
        assigned_user: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 }
      },
      {
        id: 20,
        campaign_id: campaignId,
        campaign_title: 'Audit Présence PLV Boissons Sobbra',
        title: 'Kiosque Populaire — Zone du Bois',
        location_name: 'Zone du Bois',
        latitude: 12.3750,
        longitude: -1.5050,
        reward: 2500,
        status: 'available'
      }
    ];

    return { success: true, data: points };
  }
}
