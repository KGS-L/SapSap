import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular/lazy';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthPage } from './auth.page';
import { AuthService } from '../../core/services/auth.service';

describe('AuthPage', () => {
  let component: AuthPage;
  let fixture: ComponentFixture<AuthPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuthPage],
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule,
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [AuthService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create AuthPage', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with phone step and valid phone number', () => {
    expect(component.step).toBe('phone');
    expect(component.phoneForm.valid).toBe(true);
  });

  it('should switch to OTP step when requested', () => {
    component.submittedPhone = '+22670000000';
    component.step = 'otp';
    fixture.detectChanges();
    expect(component.step).toBe('otp');
  });

  it('should populate demo OTP with shortcut button', () => {
    component.fillDemoOtp();
    expect(component.otpForm.value.otpCode).toBe('123456');
    expect(component.otpForm.valid).toBe(true);
  });
});
