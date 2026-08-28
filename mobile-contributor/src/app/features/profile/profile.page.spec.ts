import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ProfilePage } from './profile.page';
import { AuthService } from '../../core/services/auth.service';

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfilePage],
      imports: [
        ReactiveFormsModule,
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [AuthService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ProfilePage', () => {
    expect(component).toBeTruthy();
  });

  it('should compute reputation tier correctly', () => {
    expect(component.getReputationTier(95).label).toBe('Contributeur Élite');
    expect(component.getReputationTier(75).label).toBe('Contributeur Confirmé');
    expect(component.getReputationTier(50).label).toBe('Contributeur Standard');
  });
});
