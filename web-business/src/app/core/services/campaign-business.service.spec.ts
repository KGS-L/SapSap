import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CampaignBusinessService } from './campaign-business.service';
import { Campaign, CampaignStats } from '../models/campaign.model';

describe('CampaignBusinessService (QA Automation Test)', () => {
  let service: CampaignBusinessService;
  let httpMock: HttpTestingController;

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

  it('should be initialized with empty signals and false loading state', () => {
    expect(service).toBeTruthy();
    expect(service.campaigns().length).toBe(0);
    expect(service.isLoading()).toBeFalse();
  });

  it('should load business campaigns from API on success', (done) => {
    const mockData: Campaign[] = [
      {
        id: 1,
        title: 'Audit Sobbra',
        description: 'Vérification PLV',
        type: 'Audit & Présence',
        status: 'active',
        budget_total: 50000,
        reward_per_mission: 2500,
        missions_count: 20,
        completed_missions_count: 15,
        created_at: '2026-08-27'
      }
    ];
    const mockStats: CampaignStats = {
      total_campaigns: 1,
      active_campaigns: 1,
      completed_missions: 15,
      total_budget_allocated: 50000,
      total_budget_spent: 37500
    };

    service.loadCampaigns().subscribe(res => {
      expect(res.success).toBeTrue();
      expect(service.campaigns().length).toBe(1);
      expect(service.stats()?.active_campaigns).toBe(1);
      expect(service.isLoading()).toBeFalse();
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockData, stats: mockStats });
  });

  it('should load real-time campaign tracking data (Story 5.2)', (done) => {
    service.loadTracking(1).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(service.currentTracking()?.campaign_id).toBe(1);
      expect(service.isLoading()).toBeFalse();
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns/1/tracking');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: {
        campaign_id: 1,
        title: 'Audit Sobbra',
        progress_percentage: 75,
        missions_target: 20,
        missions_completed: 15,
        missions_in_progress: 3,
        budget_total: 50000,
        budget_spent: 37500,
        average_time_minutes: 24,
        completion_rate: 94
      }
    });
  });

  it('should request CSV export download (Story 5.3)', (done) => {
    const mockBlob = new Blob(['id,mission,status\n1,Test,validated'], { type: 'text/csv' });

    service.exportCampaignData(1, 'csv', { status: 'validated' }).subscribe(blob => {
      expect(blob).toBeTruthy();
      expect(blob.type).toBe('text/csv');
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/business/campaigns/1/export?format=csv&status=validated');
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);
  });
});
