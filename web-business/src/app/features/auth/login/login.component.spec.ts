import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent (QA UI & Authentication Flow E2E Test)', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, LoginComponent],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('should initialize LoginComponent with prefilled default credentials', () => {
    expect(component).toBeTruthy();
    expect(component.email).toBe('business@sobbra.bf');
    expect(component.password).toBe('Password123!');
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  it('should validate form and reject empty credentials', () => {
    component.email = '';
    component.password = '';
    component.onLogin();

    expect(component.errorMessage).toBe('Veuillez saisir votre email et mot de passe.');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to /campaigns on successful login', () => {
    spyOn(authService, 'login').and.returnValue(of(true));

    component.email = 'business@sobbra.bf';
    component.password = 'Password123!';
    component.onLogin();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'business@sobbra.bf',
      password: 'Password123!'
    });
    expect(component.isLoading).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/campaigns']);
  });

  it('should show error message when login fails', () => {
    spyOn(authService, 'login').and.returnValue(of(false));

    component.email = 'wrong@sobbra.bf';
    component.password = 'bad-password';
    component.onLogin();

    expect(component.errorMessage).toBe('Identifiants invalides. Veuillez réessayer.');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should support preset login shortcut for Orange Burkina', () => {
    spyOn(authService, 'login').and.returnValue(of(true));

    component.loginWithPreset('business@orange.bf');

    expect(component.email).toBe('business@orange.bf');
    expect(authService.login).toHaveBeenCalledWith({
      email: 'business@orange.bf',
      password: 'Password123!'
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/campaigns']);
  });
});
