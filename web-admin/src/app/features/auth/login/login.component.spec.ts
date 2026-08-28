import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create login component', () => {
    expect(component).toBeTruthy();
  });

  it('should switch roles and fill demo accounts', () => {
    component.selectRole('validator');
    expect(component.selectedRole()).toBe('validator');
    expect(component.email).toBe('validator@sapsap.bf');

    component.selectRole('admin');
    expect(component.selectedRole()).toBe('admin');
    expect(component.email).toBe('admin@sapsap.bf');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePassword();
    expect(component.showPassword()).toBeTrue();
  });

  it('should submit login and navigate to dashboard', () => {
    spyOn(router, 'navigateByUrl');
    spyOn(authService, 'login').and.returnValue(
      of({
        success: true,
        message: 'OK',
        token: 'test-token',
        user: {
          id: 1,
          name: 'Super Admin',
          email: 'admin@sapsap.bf',
          phone: '+226 70 00 00 01',
          role: 'super-admin',
          roles: ['super-admin'],
          permissions: ['*'],
          reputation_score: 100,
          created_at: new Date().toISOString()
        }
      })
    );

    component.onSubmit();
    expect(authService.login).toHaveBeenCalled();
    expect(component.isLoading()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
