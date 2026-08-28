import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService, ApiService]
    });
    service = TestBed.inject(AuthService);
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

  it('should normalize Burkina Faso phone numbers correctly', () => {
    expect(service.normalizePhoneNumber('70000000')).toBe('+22670000000');
    expect(service.normalizePhoneNumber('+226 70 00 00 00')).toBe('+22670000000');
    expect(service.normalizePhoneNumber('22670000000')).toBe('+22670000000');
    expect(service.normalizePhoneNumber('00226 70 00 00 00')).toBe('+22670000000');
  });

  it('should request OTP and return success', () => {
    service.requestOtp('70000000').subscribe(res => {
      expect(res.success).toBe(true);
      expect(res.data.phone_number).toBe('+22670000000');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/mobile/request-otp');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.phone_number).toBe('+22670000000');
    req.flush({
      success: true,
      message: 'Code OTP généré avec succès.',
      data: { phone_number: '+22670000000' }
    });
  });

  it('should verify OTP, store token and update session', () => {
    service.verifyOtp('70000000', '123456').subscribe(res => {
      expect(res.success).toBe(true);
      expect(service.isAuthenticated).toBe(true);
      expect(service.currentToken).toBe('fake-sanctum-token');
      expect(service.currentUser?.phone_number).toBe('+22670000000');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/mobile/verify-otp');
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: 'Authentification réussie.',
      data: {
        token: 'fake-sanctum-token',
        user: {
          id: 1,
          name: 'Contributeur SapSap',
          phone_number: '+22670000000',
          reputation_score: 100
        }
      }
    });
  });
});
