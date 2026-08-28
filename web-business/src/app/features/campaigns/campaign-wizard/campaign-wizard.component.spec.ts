import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { CampaignWizardComponent } from './campaign-wizard.component';
import { CampaignBusinessService } from '../../../core/services/campaign-business.service';
import { Campaign } from '../../../core/models/campaign.model';

describe('CampaignWizardComponent (QA Multi-Step Campaign Creation E2E Test)', () => {
  let component: CampaignWizardComponent;
  let fixture: ComponentFixture<CampaignWizardComponent>;
  let campaignService: CampaignBusinessService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, CampaignWizardComponent],
      providers: [CampaignBusinessService]
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignWizardComponent);
    component = fixture.componentInstance;
    campaignService = TestBed.inject(CampaignBusinessService);
    fixture.detectChanges();
  });

  it('should initialize wizard on Step 1 with default audit configuration', () => {
    expect(component).toBeTruthy();
    expect(component.currentStep()).toBe(1);
    expect(component.missionType()).toBe('audit');
    expect(component.rewardPerMission()).toBe(2500);
    expect(component.city()).toBe('Ouagadougou');
    expect(component.totalMissions()).toBe(20);
  });

  it('should adjust default reward when mission type changes', () => {
    component.selectMissionType('mystery_shopper');
    expect(component.missionType()).toBe('mystery_shopper');
    expect(component.rewardPerMission()).toBe(3500);

    component.selectMissionType('verification');
    expect(component.missionType()).toBe('verification');
    expect(component.rewardPerMission()).toBe(1500);

    component.selectMissionType('pricing');
    expect(component.missionType()).toBe('pricing');
    expect(component.rewardPerMission()).toBe(2000);
  });

  it('should block navigation if Step 1 is invalid (missing title)', () => {
    component.title.set('');
    component.nextStep();

    expect(component.currentStep()).toBe(1);
    expect(component.errorMessage()).toBe('Veuillez donner un titre explicite à votre campagne.');
  });

  it('should advance to Step 2 when title is provided', () => {
    component.title.set('Contrôle Enseignes Ouagadougou');
    component.nextStep();

    expect(component.currentStep()).toBe(2);
    expect(component.errorMessage()).toBeNull();
  });

  it('should manage neighborhood selections in Step 2', () => {
    component.title.set('Contrôle Enseignes Ouagadougou');
    component.goToStep(2);

    expect(component.selectedNeighborhoods()).toContain('Koulouba');

    component.selectAllNeighborhoods();
    expect(component.selectedNeighborhoods().length).toBe(component.allNeighborhoods.length);

    component.resetNeighborhoods();
    expect(component.selectedNeighborhoods()).toEqual(['Koulouba', 'Ouaga 2000']);
  });

  it('should add and remove questionnaire fields in Step 3', () => {
    component.title.set('Contrôle Enseignes Ouagadougou');
    component.goToStep(3);

    const initialCount = component.questions().length;

    // Add a select question
    component.newQuestionLabel.set('Disponibilité du responsable');
    component.newQuestionType.set('select');
    component.newQuestionOptionsStr.set('Présent, Absent, En tournée');
    component.newQuestionRequired.set(true);
    component.addQuestion();

    expect(component.questions().length).toBe(initialCount + 1);
    const added = component.questions()[component.questions().length - 1];
    expect(added.label).toBe('Disponibilité du responsable');
    expect(added.type).toBe('select');
    expect(added.options).toEqual(['Présent', 'Absent', 'En tournée']);

    // Remove first question
    component.removeQuestion(0);
    expect(component.questions().length).toBe(initialCount);
  });

  it('should calculate budget and platform fee dynamically in Step 4', () => {
    component.totalMissions.set(20);
    component.rewardPerMission.set(2500);

    // Subtotal = 20 * 2500 = 50,000 FCFA
    expect(component.subtotal()).toBe(50000);
    // Platform fee = 15% of 50,000 = 7,500 FCFA
    expect(component.platformFee()).toBe(7500);
    // Total budget = 50,000 + 7,500 = 57,500 FCFA
    expect(component.totalBudget()).toBe(57500);
  });

  it('should execute full submit and payment workflow, advancing to Step 5', () => {
    const mockCreatedCampaign: Campaign = {
      id: 88,
      title: 'Audit Sobbra Express',
      company_name: 'Sobbra Distribution BF',
      description: 'Audit PLV',
      type: 'audit',
      city: 'Ouagadougou',
      target_neighborhoods: 'Ouaga 2000',
      missions_count: 20,
      reward_per_mission: 2500,
      total_budget: 57500,
      status: 'draft'
    };

    spyOn(campaignService, 'createCampaign').and.returnValue(of({
      success: true,
      message: 'Campagne créée',
      data: mockCreatedCampaign
    }));

    spyOn(campaignService, 'payCampaign').and.returnValue(of({
      success: true,
      message: 'Paiement validé'
    }));

    spyOn(component.created, 'emit');

    component.title.set('Audit Sobbra Express');
    component.goToStep(4);
    component.submitCampaign();

    expect(campaignService.createCampaign).toHaveBeenCalled();
    expect(campaignService.payCampaign).toHaveBeenCalledWith(88, {
      payment_method: 'orange_money',
      phone_number: '+22670123456'
    });
    expect(component.currentStep()).toBe(5);
    expect(component.created.emit).toHaveBeenCalledWith(88);
  });

  it('should emit close event on modal close', () => {
    spyOn(component.close, 'emit');
    component.closeModal();
    expect(component.close.emit).toHaveBeenCalled();
  });
});
