import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { FraudAlertsComponent } from './fraud-alerts.component';
import { FraudAdminService } from '../../../core/services/fraud-admin.service';
import { of } from 'rxjs';
import { FraudAlert } from '../../../core/models/fraud.model';

describe('FraudAlertsComponent (QA UI / E2E Workflow Test)', () => {
  let component: FraudAlertsComponent;
  let fixture: ComponentFixture<FraudAlertsComponent>;
  let fraudService: FraudAdminService;

  const mockAlert: FraudAlert = {
    id: 1,
    user_id: 2,
    submission_id: 3,
    alert_type: 'duplicate_image',
    severity: 'high',
    title: 'Image dupliquée détectée',
    description: 'SHA-256 collision',
    status: 'pending',
    created_at: '2026-08-27 10:00:00',
    updated_at: '2026-08-27 10:00:00',
    user: {
      id: 2,
      name: 'Ibrahim Kaboré',
      email: 'ibrahim@sapsap.bf',
      phone: '+226 65 11 22 33',
      reputation_score: 64,
      is_active: true
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, FraudAlertsComponent],
      providers: [FraudAdminService]
    }).compileComponents();

    fixture = TestBed.createComponent(FraudAlertsComponent);
    component = fixture.componentInstance;
    fraudService = TestBed.inject(FraudAdminService);
    fixture.detectChanges();
  });

  it('should create FraudAlertsComponent and initialize tabs', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('all');
  });

  it('should switch tabs and update filter parameters', () => {
    spyOn(fraudService, 'loadAlerts').and.returnValue(of({ success: true, data: [], counts: { total: 0, pending: 0, duplicate_images: 0, device_sharing: 0, resolved: 0 } }));
    
    component.setTab('duplicate_image');
    expect(component.activeTab()).toBe('duplicate_image');
    expect(fraudService.loadAlerts).toHaveBeenCalledWith('all', 'duplicate_image');

    component.setTab('pending');
    expect(component.activeTab()).toBe('pending');
    expect(fraudService.loadAlerts).toHaveBeenCalledWith('pending', 'all');
  });

  it('should open and close investigation modal with selected alert', () => {
    component.openInvestigateModal(mockAlert);
    expect(component.isInvestigateModalOpen()).toBeTrue();
    expect(component.selectedAlert()).toEqual(mockAlert);

    component.closeInvestigateModal();
    expect(component.isInvestigateModalOpen()).toBeFalse();
  });

  it('should execute sanction workflow when confirmed', () => {
    spyOn(fraudService, 'resolveAlert').and.returnValue(of({ success: true, data: mockAlert, message: 'OK' }));
    spyOn(component, 'loadAlerts');

    component.openSanctionModal(mockAlert);
    component.sanctionAction = 'account_suspended';
    component.actionNote = 'Suspension pour fraude confirmée';

    component.confirmSanction();

    expect(fraudService.resolveAlert).toHaveBeenCalledWith(1, 'account_suspended', 'Suspension pour fraude confirmée');
    expect(component.isSanctionModalOpen()).toBeFalse();
    expect(component.loadAlerts).toHaveBeenCalled();
  });

  it('should execute dismissal workflow for false positives', () => {
    spyOn(fraudService, 'dismissAlert').and.returnValue(of({ success: true, data: mockAlert, message: 'OK' }));
    spyOn(component, 'loadAlerts');

    component.openDismissModal(mockAlert);
    component.actionNote = 'Vérification terrain OK';

    component.confirmDismiss();

    expect(fraudService.dismissAlert).toHaveBeenCalledWith(1, 'Vérification terrain OK');
    expect(component.isDismissModalOpen()).toBeFalse();
    expect(component.loadAlerts).toHaveBeenCalled();
  });
});
