import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, BusinessUser, LoginResponse } from './auth.service';

describe('AuthService (QA Authentication & Session Service Tests)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should initialize with default authenticated session for smooth demo navigation', () => {
    expect(service).toBeTruthy();
    expect(service.currentUser()).toBeTruthy();
    expect(service.currentUser()?.email).toBe('business@sobbra.bf');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getToken()).toBe('mock-token-sobbra-bf');
  });

  it('should authenticate user with valid credentials from backend API', (done) => {
    const mockResponse: LoginResponse = {
      success: true,
      message: 'Connexion réussie',
      data: {
        token: 'sanctum-token-12345',
        user: {
          id: 5,
          name: 'Directeur Commercial',
          email: 'commercial@sobbra.bf',
          roles: ['company-admin']
        }
      }
    };

    service.login({ email: 'commercial@sobbra.bf', password: 'Password123!' }).subscribe(success => {
      expect(success).toBeTrue();
      expect(service.currentUser()?.name).toBe('Directeur Commercial');
      expect(service.token()).toBe('sanctum-token-12345');
      expect(service.isAuthenticated()).toBeTrue();
      expect(localStorage.getItem('sapsap_business_token')).toBe('sanctum-token-12345');
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should fallback to demo session when backend API fails with Orange profile', (done) => {
    service.login({ email: 'business@orange.bf', password: 'Password123!' }).subscribe(success => {
      expect(success).toBeTrue();
      expect(service.currentUser()?.company_name).toBe('Orange Burkina SA');
      expect(service.currentUser()?.email).toBe('business@orange.bf');
      expect(service.isAuthenticated()).toBeTrue();
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/auth/login');
    req.error(new ProgressEvent('Network error'));
  });

  it('should fallback to demo session when backend API fails with Sobbra profile', (done) => {
    service.login({ email: 'business@sobbra.bf', password: 'Password123!' }).subscribe(success => {
      expect(success).toBeTrue();
      expect(service.currentUser()?.company_name).toBe('Sobbra Distribution BF');
      expect(service.currentUser()?.email).toBe('business@sobbra.bf');
      expect(service.isAuthenticated()).toBeTrue();
      done();
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/auth/login');
    req.error(new ProgressEvent('Network error'));
  });

  it('should clear session and redirect to /login on logout', () => {
    service.logout();

    const req = httpMock.expectOne('http://localhost:8000/api/v1/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });

    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
