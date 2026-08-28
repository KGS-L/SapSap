import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SubmissionAdminService } from './submission-admin.service';
import { AdminStatsService } from './admin-stats.service';
import { environment } from '../../../environments/environment';
import { SubmissionListResponse, SubmissionDetailResponse } from '../models/submission.model';

describe('SubmissionAdminService (QA Automation Test)', () => {
  let service: SubmissionAdminService;
  let httpMock: HttpTestingController;
  let statsService: AdminStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SubmissionAdminService,
        AdminStatsService
      ]
    });

    service = TestBed.inject(SubmissionAdminService);
    httpMock = TestBed.inject(HttpTestingController);
    statsService = TestBed.inject(AdminStatsService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be initialized with default mock submissions', () => {
    expect(service).toBeTruthy();
    expect(service.submissions().length).toBeGreaterThan(0);
    expect(service.counts().total).toBe(5);
  });

  it('should load submissions from backend API', (done) => {
    const mockApiResponse: SubmissionListResponse = {
      success: true,
      data: [
        {
          id: 101,
          mission_id: 1,
          user_id: 2,
          status: 'submitted',
          submitted_latitude: 12.37,
          submitted_longitude: -1.52,
          gps_accuracy: 5.0,
          gps_distance_meters: 15.0,
          device_id: 'DEV-TEST-01',
          answers: { 'Question': 'Reponse' },
          photos: ['https://example.com/photo.jpg'],
          created_at: '2026-08-27 12:00:00',
          updated_at: '2026-08-27 12:00:00'
        }
      ],
      counts: {
        total: 1,
        submitted: 1,
        validated: 0,
        rejected: 0,
        fraud_suspect: 0
      }
    };

    service.loadSubmissions('submitted').subscribe((res: any) => {
      expect(res.success).toBeTrue();
      expect(service.submissions().length).toBe(1);
      expect(service.submissions()[0].id).toBe(101);
      expect(service.counts().submitted).toBe(1);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/submissions?status=submitted`);
    expect((req.request as any).method).toBe('GET');
    req.flush(mockApiResponse);
  });

  it('should validate a submission and trigger refresh', (done) => {
    const mockDetail: SubmissionDetailResponse = {
      success: true,
      data: {
        id: 1,
        mission_id: 1,
        user_id: 1,
        status: 'validated',
        gps_accuracy: 5.0,
        gps_distance_meters: 10.0,
        created_at: '2026-08-27 10:00:00',
        updated_at: '2026-08-27 10:00:00'
      },
      message: 'Soumission validée avec succès.'
    };

    service.validateSubmission(1).subscribe((res: any) => {
      expect(res.success).toBeTrue();
      done();
    });

    const validateReq = httpMock.expectOne(`${environment.apiUrl}/admin/submissions/1/validate`);
    expect((validateReq.request as any).method).toBe('POST');
    validateReq.flush(mockDetail);

    // validateSubmission triggers loadSubmissions on success
    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/admin/submissions`);
    refreshReq.flush({ success: true, data: [], counts: { total: 0, submitted: 0, validated: 0, rejected: 0, fraud_suspect: 0 } });
  });

  it('should reject a submission with mandatory reason', (done) => {
    const mockDetail: SubmissionDetailResponse = {
      success: true,
      data: {
        id: 1,
        mission_id: 1,
        user_id: 1,
        status: 'rejected',
        rejection_reason: 'Photo floue illisible',
        gps_accuracy: 5.0,
        gps_distance_meters: 10.0,
        created_at: '2026-08-27 10:00:00',
        updated_at: '2026-08-27 10:00:00'
      },
      message: 'Soumission rejetée avec succès.'
    };

    service.rejectSubmission(1, 'Photo floue illisible').subscribe((res: any) => {
      expect(res.success).toBeTrue();
      done();
    });

    const rejectReq = httpMock.expectOne(`${environment.apiUrl}/admin/submissions/1/reject`);
    expect((rejectReq.request as any).method).toBe('POST');
    expect((rejectReq.request as any).body).toEqual({ reason: 'Photo floue illisible' });
    rejectReq.flush(mockDetail);

    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/admin/submissions`);
    refreshReq.flush({ success: true, data: [], counts: { total: 0, submitted: 0, validated: 0, rejected: 0, fraud_suspect: 0 } });
  });
});
