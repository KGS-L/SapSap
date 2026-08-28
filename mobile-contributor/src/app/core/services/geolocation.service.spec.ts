import { TestBed } from '@angular/core/testing';
import { GeolocationService } from './geolocation.service';

describe('GeolocationService', () => {
  let service: GeolocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GeolocationService]
    });
    service = TestBed.inject(GeolocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate distance in meters accurately via Haversine', () => {
    // Distance entre Koulouba (12.3689, -1.5245) et Somgandé (12.3854, -1.5087)
    const dist = service.calculateDistanceMeters(12.3689, -1.5245, 12.3854, -1.5087);
    expect(dist).toBeGreaterThan(2000);
    expect(dist).toBeLessThan(3500);
  });

  it('should format distance in m and km accurately', () => {
    expect(service.formatDistance(45)).toBe('45 m');
    expect(service.formatDistance(850)).toBe('850 m');
    expect(service.formatDistance(1500)).toBe('1.5 km');
    expect(service.formatDistance(3200)).toBe('3.2 km');
  });

  it('should detect if coordinates are within radius of 100m', () => {
    const checkSame = service.isWithinRadius(12.371420, -1.519700, 100);
    expect(checkSame.withinRadius).toBe(true);
    expect(checkSame.distanceMeters).toBeLessThanOrEqual(100);
  });
});
