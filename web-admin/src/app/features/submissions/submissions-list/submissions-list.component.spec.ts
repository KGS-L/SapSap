import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubmissionsListComponent } from './submissions-list.component';
import { SubmissionAdminService } from '../../../core/services/submission-admin.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Submission } from '../../../core/models/submission.model';

describe('SubmissionsListComponent', () => {
  let component: SubmissionsListComponent;
  let fixture: ComponentFixture<SubmissionsListComponent>;
  let submissionService: SubmissionAdminService;

  const mockSubmissionsList: Submission[] = [
    {
      id: 1,
      mission_id: 1,
      user_id: 1,
      status: 'submitted',
      submitted_latitude: 12.3716,
      submitted_longitude: -1.5195,
      gps_accuracy: 8.0,
      gps_distance_meters: 22.0,
      device_id: 'DEV-BF-OUAGA-99182',
      photos: ['https://images.unsplash.com/photo-1?w=600', 'https://images.unsplash.com/photo-2?w=600'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { id: 1, name: 'Moussa Ouédraogo', email: 'moussa@sapsap.bf', phone: '+226 70 12 34 56', reputation_score: 96 },
      mission: {
        id: 1,
        campaign_id: 1,
        title: 'Audit Maquis Kiosque #1',
        location_name: 'Patte d\'Oie',
        reward: 3000,
        campaign: { id: 1, title: 'Audit Sobbra', company_name: 'Sobbra BF', type: 'Audit', city: 'Ouagadougou' }
      }
    },
    {
      id: 2,
      mission_id: 2,
      user_id: 2,
      status: 'submitted',
      submitted_latitude: 12.3768,
      submitted_longitude: -1.5142,
      gps_accuracy: 12.0,
      gps_distance_meters: 45.0,
      device_id: 'DEV-BF-OUAGA-77211',
      photos: ['https://images.unsplash.com/photo-3?w=600'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { id: 2, name: 'Amina Sawadogo', email: 'amina@sapsap.bf', phone: '+226 76 98 76 54', reputation_score: 92 },
      mission: {
        id: 2,
        campaign_id: 2,
        title: 'Relevé Totem Station',
        location_name: 'Gounghin',
        reward: 2500,
        campaign: { id: 2, title: 'Relevé Carburant', company_name: 'Observatoire BF', type: 'Relevé', city: 'Ouagadougou' }
      }
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionsListComponent, HttpClientTestingModule],
      providers: [SubmissionAdminService]
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionsListComponent);
    component = fixture.componentInstance;
    submissionService = TestBed.inject(SubmissionAdminService);

    spyOn(submissionService, 'loadSubmissions').and.returnValue(
      of({
        success: true,
        data: mockSubmissionsList,
        counts: { total: 2, submitted: 2, validated: 0, rejected: 0, fraud_suspect: 0 }
      })
    );

    fixture.detectChanges();
  });

  it('should create the component and load submissions', () => {
    expect(component).toBeTruthy();
    expect(submissionService.loadSubmissions).toHaveBeenCalled();
  });

  it('should open and close the split-screen inspection desk', () => {
    const sub = mockSubmissionsList[0];
    component.openInspectModal(sub, 0);

    expect(component.isInspectModalOpen()).toBeTrue();
    expect(component.selectedSubmission()?.id).toBe(1);
    expect(component.currentQueueIndex()).toBe(0);
    expect(component.zoomedPhoto()).toBe(sub.photos![0]);

    component.closeInspectModal();
    expect(component.isInspectModalOpen()).toBeFalse();
    expect(component.selectedSubmission()).toBeNull();
  });

  it('should navigate next and previous in queue', () => {
    component.openInspectModal(mockSubmissionsList[0], 0);
    expect(component.currentQueueIndex()).toBe(0);

    // Go Next
    component.goToNextSubmission();
    expect(component.currentQueueIndex()).toBe(1);
    expect(component.selectedSubmission()?.id).toBe(2);

    // Go Previous
    component.goToPreviousSubmission();
    expect(component.currentQueueIndex()).toBe(0);
    expect(component.selectedSubmission()?.id).toBe(1);
  });

  it('should handle keyboard shortcuts for validation ([E]) and navigation ([J]/[K])', () => {
    spyOn(component, 'onValidate');
    spyOn(component, 'goToNextSubmission');
    spyOn(component, 'goToPreviousSubmission');

    component.openInspectModal(mockSubmissionsList[0], 0);

    // Press 'e' -> Validate
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
    expect(component.onValidate).toHaveBeenCalledWith(mockSubmissionsList[0]);

    // Press 'j' -> Next
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    expect(component.goToNextSubmission).toHaveBeenCalled();

    // Press 'k' -> Previous
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    expect(component.goToPreviousSubmission).toHaveBeenCalled();
  });

  it('should handle keyboard shortcut [R] to open rejection modal', () => {
    component.openInspectModal(mockSubmissionsList[0], 0);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(component.isRejectModalOpen()).toBeTrue();

    // Press 'Escape' -> Close reject modal
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.isRejectModalOpen()).toBeFalse();
  });

  it('should validate submission and trigger feedback', () => {
    spyOn(submissionService, 'validateSubmission').and.returnValue(
      of({
        success: true,
        data: { ...mockSubmissionsList[0], status: 'validated' }
      })
    );

    component.openInspectModal(mockSubmissionsList[0], 0);
    component.onValidate(mockSubmissionsList[0]);

    expect(submissionService.validateSubmission).toHaveBeenCalledWith(1);
    expect(component.actionFeedback()).toContain('validée');
  });

  it('should reject submission with quick reason preset', () => {
    spyOn(submissionService, 'rejectSubmission').and.returnValue(
      of({
        success: true,
        data: { ...mockSubmissionsList[0], status: 'rejected' }
      })
    );

    component.openInspectModal(mockSubmissionsList[0], 0);
    component.openRejectModal(mockSubmissionsList[0]);

    const preset = component.quickRejectionPresets[0];
    component.applyQuickReason(preset.text);
    expect(component.rejectionReason).toBe(preset.text);

    component.confirmReject();
    expect(submissionService.rejectSubmission).toHaveBeenCalledWith(1, preset.text);
    expect(component.isRejectModalOpen()).toBeFalse();
  });

  it('should toggle zoom state with [Z] or toggleZoom()', () => {
    expect(component.isZoomed()).toBeFalse();
    component.toggleZoom();
    expect(component.isZoomed()).toBeTrue();
    component.toggleZoom();
    expect(component.isZoomed()).toBeFalse();
  });

  it('should toggle shortcuts help modal', () => {
    expect(component.isShortcutsHelpOpen()).toBeFalse();
    component.toggleShortcutsHelp();
    expect(component.isShortcutsHelpOpen()).toBeTrue();
    component.toggleShortcutsHelp();
    expect(component.isShortcutsHelpOpen()).toBeFalse();
  });
});
