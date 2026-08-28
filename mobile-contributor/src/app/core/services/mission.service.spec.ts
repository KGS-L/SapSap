import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MissionService } from './mission.service';
import { ApiService } from './api.service';
import { GeolocationService } from './geolocation.service';

describe('MissionService', () => {
  let service: MissionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MissionService, ApiService, GeolocationService]
    });
    service = TestBed.inject(MissionService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch available missions and enrich distance', () => {
    service.getAvailableMissions(12.371420, -1.519700).subscribe(res => {
      expect(res.success).toBe(true);
      expect(res.data.length).toBe(1);
      expect(res.data[0].distance_km).toBeDefined();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/missions?lat=12.37142&lng=-1.5197');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      message: 'Missions disponibles récupérées.',
      data: [
        {
          id: 1,
          campaign_id: 1,
          title: 'Mission Somgandé',
          reward_amount: 1500,
          latitude: 12.385420,
          longitude: -1.508700,
          radius_meters: 100,
          required_photos_count: 1,
          status: 'available'
        }
      ]
    });
  });

  it('should reserve mission and store active reservation', () => {
    const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
    service.reserveMission(1).subscribe(res => {
      expect(res.success).toBe(true);
      expect(service.getActiveReservationValue()?.mission_id).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/missions/1/reserve');
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: 'Mission réservée avec succès.',
      data: {
        mission_id: 1,
        title: 'Mission Somgandé',
        status: 'assigned',
        assigned_at: new Date().toISOString(),
        expires_at: expiresAt,
        lock_duration_minutes: 45
      }
    });
  });
});
