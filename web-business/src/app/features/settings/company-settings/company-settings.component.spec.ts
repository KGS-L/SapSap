import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { CompanySettingsComponent } from './company-settings.component';
import { AuthService } from '../../../core/services/auth.service';

describe('CompanySettingsComponent (QA Business Settings & API Key Test)', () => {
  let component: CompanySettingsComponent;
  let fixture: ComponentFixture<CompanySettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, CompanySettingsComponent],
      providers: [AuthService]
    }).compileComponents();

    fixture = TestBed.createComponent(CompanySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize settings on profile tab with company info', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('profile');
    expect(component.companyName()).toBe('Sobbra Distribution BF');
    expect(component.email()).toBe('business@sobbra.bf');
  });

  it('should switch between settings tabs', () => {
    component.activeTab.set('billing');
    expect(component.activeTab()).toBe('billing');

    component.activeTab.set('notifications');
    expect(component.activeTab()).toBe('notifications');

    component.activeTab.set('api');
    expect(component.activeTab()).toBe('api');
  });

  it('should save profile modifications and display toast', () => {
    component.companyName.set('Sobbra Distribution BF (Mis à jour)');
    component.saveProfile();
    expect(component.toastMessage()).toContain('mises à jour avec succès');
  });

  it('should save billing and notification settings', () => {
    component.defaultMobileMoney.set('+22670998877');
    component.saveBilling();
    expect(component.toastMessage()).toContain('facturation et Mobile Money');

    component.notifyOnSubmission.set(false);
    component.saveNotifications();
    expect(component.toastMessage()).toContain('notifications enregistrées');
  });

  it('should regenerate API key with new token', () => {
    const initialKey = component.apiKey();
    component.regenerateApiKey();

    expect(component.apiKey()).not.toBe(initialKey);
    expect(component.apiKey()).toContain('sapsap_live_sk_');
    expect(component.toastMessage()).toContain('Nouvelle clé API générée');
  });
});
