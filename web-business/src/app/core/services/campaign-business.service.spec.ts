import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CampaignBusinessService } from './campaign-business.service';
import { Campaign, CampaignStats, CreateCampaignDto, PayCampaignDto, ResultPoint, TrackingData } from '../models/campaign.model';

describe('CampaignBusinessService (QA API & Business Service Tests)', () => {
  let service: CampaignBusinessService;
  let httpMock: HttpTestingController;

  const mockCampaign: Campaign = {
    id: 1,
    title: 'Audit Présence PLV Boissons Sobbra Ouagadougou',
    company_name: 'Sobbra Distribution BF',
    description: 'Contrôle visuel des affiches et de la disponibilité des boissons',
    type: 'Audit & Présence',
    city: 'Ouagadougou',
    target_neighborhoods: 'Patte d\'Oie, Gounghin, Ouaga 2000',
    missions_count: 20,
    reward_per_mission: 2500,
    total_budget: 57500,
    status: 'active',
    completed_missions: 14,
    submitted_missions: 3,
    reserved_missions: 2,
    available_missions: 1,
    progress_percent: 70,
    spent_budget: 35000,
    remaining_budget: 15000,
    created_at: '2026-08-27T10:00:00Z'
  };

  const mockStats: CampaignStats = {
    total_campaigns: 1,
    active_campaigns: 1,
    total_missions_target: 20,
    total_missions_completed: 14,
    total_budget_allocated: 57500,
    total_budget_spent: 35000
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CampaignBusinessService]
    });

    service = TestBed.inject(CampaignBusinessService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should initialize with empty state and false loading flag', () => {
    expect(service).toBeTruthy();
    expect(service.campaigns().length).toBe(0);
    expect(service.stats()).toBeNull();
    expect(service.currentTracking()).toBeNull();
    expect(service.currentResultsMap().length).toBe(0);
    expect(service.isLoading()).toBeFalse();
    expect(service.error()).toBeNull();
  });

  it('should return Ouagadougou neighborhoods list', () => {
    const neighborhoods = service.getOuagadougouNeighborhoods();
    expect(neighborhoods.length).toBeGreaterThan(10);
    expect(neighborhoods).toContain('Ouaga 2000');
    expect(neighborhoods).toContain('Patte d\'Oie');
    expect(neighborhoods).toContain('Gounghin');
  });

  it('should load business campaigns from API on success', (done) => {
    service.loadCampaigns().subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.length).toBe(1);
      expect(service.campaigns().length).toBe(1);
      expect(service.campaigns()[0].title).toBe('Audit Présence PLV Boissons Sobbra Ouagadougou');
      expect(service.stats()?.active_campaigns).toBe(1);
      expect(service.isLoading()).toBeFalse();
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [mockCampaign], stats: mockStats });
  });

  it('should fallback to mock campaigns when backend API is unreachable', (done) => {
    service.loadCampaigns().subscribe(res => {
      expect(res.success).toBeTrue();
      expect(service.campaigns().length).toBeGreaterThan(0);
      expect(service.stats()).toBeTruthy();
      expect(service.isLoading()).toBeFalse();
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns');
    req.error(new ProgressEvent('Network error'));
  });

  it('should load real-time campaign tracking data (Story 5.2)', (done) => {
    const mockTracking: TrackingData = {
      campaign: mockCampaign,
      metrics: {
        total_missions: 20,
        completed_missions: 14,
        submitted_missions: 3,
        reserved_missions: 2,
        available_missions: 1,
        progress_percent: 70,
        spent_budget: 35000,
        escrow_remaining: 15000,
        average_gps_accuracy_m: 12.5,
        compliance_rate_percent: 95
      },
      neighborhood_stats: [
        { neighborhood: 'Ouaga 2000', total_points: 5, completed_points: 5, progress_percent: 100 }
      ],
      recent_activity: []
    };

    service.loadTracking(1).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(service.currentTracking()?.campaign.id).toBe(1);
      expect(service.currentTracking()?.metrics.progress_percent).toBe(70);
      expect(service.isLoading()).toBeFalse();
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns/1/tracking');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockTracking });
  });

  it('should fallback to mock tracking data when backend API is unreachable', (done) => {
    service.loadTracking(1).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(service.currentTracking()?.campaign.id).toBe(1);
      expect(service.currentTracking()?.metrics.total_missions).toBe(20);
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns/1/tracking');
    req.error(new ProgressEvent('Network error'));
  });

  it('should load results map points (Story 5.2)', (done) => {
    const mockPoints: ResultPoint[] = [
      {
        id: 1,
        campaign_id: 1,
        campaign_title: 'Audit Sobbra',
        title: 'Maquis Le Régal',
        location_name: 'Patte d\'Oie',
        latitude: 12.3325,
        longitude: -1.5120,
        reward: 2500,
        status: 'validated'
      }
    ];

    service.loadResultsMap(1).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(service.currentResultsMap().length).toBe(1);
      expect(service.currentResultsMap()[0].title).toBe('Maquis Le Régal');
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns/1/results-map');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockPoints });
  });

  it('should create new campaign via API and update reactive signal', (done) => {
    const payload: CreateCampaignDto = {
      title: 'Audit Vitrines Orange',
      description: 'Audit de conformité des vitrines',
      mission_type: 'audit',
      location_city: 'Ouagadougou',
      target_district: 'Ouaga 2000',
      questionnaire_schema: [{ id: 'q1', label: 'Photo vitrine', type: 'photo', required: true }],
      required_photos_count: 2,
      total_missions_requested: 10,
      reward_per_mission: 2000
    };

    service.createCampaign(payload).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.title).toBe('Audit Vitrines Orange');
      expect(service.campaigns().length).toBe(1);
      expect(service.campaigns()[0].title).toBe('Audit Vitrines Orange');
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      success: true,
      message: 'Campagne créée',
      data: { ...mockCampaign, id: 99, title: 'Audit Vitrines Orange', status: 'draft' }
    });
  });

  it('should handle offline campaign creation with fee calculation', (done) => {
    const payload: CreateCampaignDto = {
      title: 'Relevé Offline',
      description: 'Test mode déconnecté',
      mission_type: 'pricing',
      location_city: 'Ouagadougou',
      target_district: 'Gounghin',
      questionnaire_schema: [],
      required_photos_count: 1,
      total_missions_requested: 20,
      reward_per_mission: 1000
    };

    service.createCampaign(payload).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.title).toBe('Relevé Offline');
      // Subtotal: 20,000 + 15% fee (3,000) = 23,000
      expect(res.data.total_budget).toBe(23000);
      expect(res.data.status).toBe('draft');
      expect(service.campaigns().length).toBe(1);
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns');
    req.error(new ProgressEvent('Network error'));
  });

  it('should pay campaign and place budget in escrow (Mobile Money)', (done) => {
    service.campaigns.set([mockCampaign]);
    const payDto: PayCampaignDto = {
      payment_method: 'orange_money',
      phone_number: '+22670123456'
    };

    service.payCampaign(1, payDto).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(service.campaigns()[0].status).toBe('pending');
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns/1/pay');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payDto);
    req.flush({ success: true, message: 'Budget sous séquestre validé' });
  });

  it('should export campaign data as Blob (Story 5.3)', (done) => {
    const mockBlob = new Blob(['id,mission,status\n1,Test,validated'], { type: 'text/csv' });

    service.exportCampaignData(1, 'csv', { status: 'validated', neighborhood: 'Gounghin' }).subscribe(blob => {
      expect(blob).toBeTruthy();
      expect(blob.type).toBe('text/csv');
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns/1/export/csv?status=validated&neighborhood=Gounghin');
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);
  });
});
