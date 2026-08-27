import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CampaignAdminService } from './campaign-admin.service';
import { AdminStatsService } from './admin-stats.service';
import { environment } from '../../../environments/environment';
import { CampaignListResponse, CampaignDetailResponse } from '../models/campaign.model';

describe('CampaignAdminService (QA Automation Test)', () => {
  let service: CampaignAdminService;
  let httpMock: HttpTestingController;
  let statsService: AdminStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CampaignAdminService, AdminStatsService]
    });

    service = TestBed.inject(CampaignAdminService);
    httpMock = TestBed.inject(HttpTestingController);
    statsService = TestBed.inject(AdminStatsService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load campaigns and update signals', (done) => {
    const mockResponse: CampaignListResponse = {
      success: true,
      data: [
        {
          id: 1,
          title: 'Campagne Sobbra',
          description: 'Audit maquis',
          type: 'Audit',
          status: 'pending',
          budget_total: 50000,
          reward_per_mission: 2500,
          missions_count: 20,
          city: 'Ouagadougou',
          created_at: '2026-08-27'
        }
      ],
      counts: {
        total: 1,
        pending: 1,
        active: 0,
        rejected: 0
      }
    };

    service.loadCampaigns('pending').subscribe((res) => {
      expect(res.success).toBeTrue();
      expect(service.campaigns().length).toBe(1);
      expect(service.counts().pending).toBe(1);
      expect(service.isLoading()).toBeFalse();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/campaigns?status=pending`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should approve campaign and refresh campaign list', (done) => {
    const mockApprove: CampaignDetailResponse = {
      success: true,
      data: {
        id: 1,
        title: 'Campagne Sobbra',
        status: 'active',
        created_at: '2026-08-27'
      }
    };

    service.approveCampaign(1).subscribe((res) => {
      expect(res.success).toBeTrue();
      done();
    });

    const approveReq = httpMock.expectOne(`${environment.apiUrl}/admin/campaigns/1/approve`);
    expect(approveReq.request.method).toBe('POST');
    approveReq.flush(mockApprove);

    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/admin/campaigns`);
    refreshReq.flush({ success: true, data: [], counts: { total: 0, pending: 0, active: 0, rejected: 0 } });
  });

  it('should reject campaign with mandatory reason', (done) => {
    const mockReject: CampaignDetailResponse = {
      success: true,
      data: {
        id: 2,
        title: 'Campagne Invalide',
        status: 'rejected',
        rejection_reason: 'Non-conforme aux règles de modération',
        created_at: '2026-08-27'
      }
    };

    service.rejectCampaign(2, 'Non-conforme aux règles de modération').subscribe((res) => {
      expect(res.success).toBeTrue();
      done();
    });

    const rejectReq = httpMock.expectOne(`${environment.apiUrl}/admin/campaigns/2/reject`);
    expect(rejectReq.request.method).toBe('POST');
    expect(rejectReq.request.body).toEqual({ reason: 'Non-conforme aux règles de modération' });
    rejectReq.flush(mockReject);

    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/admin/campaigns`);
    refreshReq.flush({ success: true, data: [], counts: { total: 0, pending: 0, active: 0, rejected: 0 } });
  });
});
