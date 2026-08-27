import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FraudAdminService } from './fraud-admin.service';
import { AdminStatsService } from './admin-stats.service';
import { environment } from '../../../environments/environment';
import { FraudAlertListResponse, FraudDetailResponse } from '../models/fraud.model';

describe('FraudAdminService (QA Automation Test)', () => {
  let service: FraudAdminService;
  let httpMock: HttpTestingController;
  let statsService: AdminStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FraudAdminService, AdminStatsService]
    });

    service = TestBed.inject(FraudAdminService);
    httpMock = TestBed.inject(HttpTestingController);
    statsService = TestBed.inject(AdminStatsService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and have initial default signal counts', () => {
    expect(service).toBeTruthy();
    expect(service.counts().total).toBeGreaterThan(0);
    expect(service.isLoading()).toBeFalse();
  });

  it('should fetch fraud alerts from API on success', (done) => {
    const mockApiResponse: FraudAlertListResponse = {
      success: true,
      data: [
        {
          id: 10,
          user_id: 1,
          submission_id: 5,
          alert_type: 'duplicate_image',
          severity: 'high',
          title: 'Photo dupliquée',
          description: 'SHA-256 collision',
          status: 'pending',
          created_at: '2026-08-27 10:00:00',
          updated_at: '2026-08-27 10:00:00'
        }
      ],
      counts: {
        total: 1,
        pending: 1,
        duplicate_images: 1,
        device_sharing: 0,
        resolved: 0
      }
    };

    service.loadAlerts('pending', 'duplicate_image').subscribe((res) => {
      expect(res.success).toBeTrue();
      expect(service.alerts().length).toBe(1);
      expect(service.alerts()[0].id).toBe(10);
      expect(service.counts().pending).toBe(1);
      expect(service.isLoading()).toBeFalse();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/fraud/alerts?status=pending&type=duplicate_image`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApiResponse);
  });

  it('should gracefully fallback to local mock alerts when API is offline', (done) => {
    service.loadAlerts('all', 'all').subscribe((res) => {
      expect(res.success).toBeTrue();
      expect(service.alerts().length).toBeGreaterThan(0);
      expect(service.isLoading()).toBeFalse();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/fraud/alerts?status=all`);
    req.error(new ProgressEvent('Network error'));
  });

  it('should resolve an alert with specific sanction and update state', (done) => {
    const mockDetailResponse: FraudDetailResponse = {
      success: true,
      data: {
        id: 1,
        alert_type: 'duplicate_image',
        severity: 'high',
        title: 'Image dupliquée',
        description: 'Test description',
        status: 'resolved',
        resolution_action: 'account_suspended',
        created_at: '2026-08-27 10:00:00',
        updated_at: '2026-08-27 10:00:00'
      },
      message: 'Alerte résolue avec succès.'
    };

    service.resolveAlert(1, 'account_suspended', 'Compte sanctionné').subscribe((res) => {
      expect(res.success).toBeTrue();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/fraud/alerts/1/resolve`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ action: 'account_suspended', note: 'Compte sanctionné' });
    req.flush(mockDetailResponse);
  });

  it('should dismiss an alert as false positive', (done) => {
    const mockDismissResponse: FraudDetailResponse = {
      success: true,
      data: {
        id: 2,
        alert_type: 'device_sharing',
        severity: 'medium',
        title: 'Device sharing',
        description: 'Test',
        status: 'dismissed',
        created_at: '2026-08-27 10:00:00',
        updated_at: '2026-08-27 10:00:00'
      },
      message: 'Alerte classée sans suite.'
    };

    service.dismissAlert(2, 'Faux positif').subscribe((res) => {
      expect(res.success).toBeTrue();
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/fraud/alerts/2/dismiss`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ note: 'Faux positif' });
    req.flush(mockDismissResponse);
  });
});
