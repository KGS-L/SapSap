import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { AuthService } from '../core/services/auth.service';
import { CampaignBusinessService } from '../core/services/campaign-business.service';
import { Campaign, ResultPoint } from '../core/models/campaign.model';
import { LoginComponent } from './auth/login/login.component';
import { CampaignsListComponent } from './campaigns/campaigns-list/campaigns-list.component';
import { CampaignWizardComponent } from './campaigns/campaign-wizard/campaign-wizard.component';
import { CampaignTrackingComponent } from './tracking/campaign-tracking/campaign-tracking.component';
import { ExportsHistoryComponent } from './exports/exports-history/exports-history.component';
import { CompanySettingsComponent } from './settings/company-settings/company-settings.component';
import { BusinessLayoutComponent } from '../layout/business-layout/business-layout.component';
import { ActivatedRoute } from '@angular/router';

describe('E2E Business Portal User Journey (SapSap Web-Business)', () => {
  let authService: AuthService;
  let campaignService: CampaignBusinessService;

  const mockCampaigns: Campaign[] = [
    {
      id: 1,
      title: 'Audit Présence PLV Boissons Sobbra',
      company_name: 'Sobbra Distribution BF',
      description: 'Audit des affiches et réfrigérateurs',
      type: 'Audit & Présence',
      city: 'Ouagadougou',
      target_neighborhoods: 'Koulouba, Ouaga 2000',
      missions_count: 20,
      reward_per_mission: 2500,
      total_budget: 57500,
      status: 'active',
      completed_missions: 14,
      progress_percent: 70
    },
    {
      id: 2,
      title: 'Relevé de Prix Huile & Farine',
      company_name: 'Sobbra Distribution BF',
      description: 'Veille concurrentielle',
      type: 'Relevé de Prix',
      city: 'Ouagadougou',
      target_neighborhoods: 'Gounghin, Pissy',
      missions_count: 35,
      reward_per_mission: 2000,
      total_budget: 80500,
      status: 'completed',
      completed_missions: 35,
      progress_percent: 100
    }
  ];

  const mockPoints: ResultPoint[] = [
    {
      id: 101,
      campaign_id: 1,
      campaign_title: 'Audit Présence PLV Boissons Sobbra',
      title: 'Maquis Le Régal — Patte d\'Oie',
      location_name: 'Patte d\'Oie, Face échangeur',
      latitude: 12.3325,
      longitude: -1.5120,
      reward: 2500,
      status: 'validated',
      assigned_user: { id: 1, name: 'Moussa Ouédraogo', reputation_score: 96 },
      submission: {
        id: 201,
        status: 'validated',
        submitted_latitude: 12.3326,
        submitted_longitude: -1.5121,
        gps_accuracy: 5.5,
        gps_distance_meters: 15.0,
        answers: {
          'Affiches publicitaires visibles': 'Oui, grande bâche PLV Sobbra'
        },
        photos: ['https://example.com/photo1.jpg'],
        created_at: '2026-08-27T10:15:00Z',
        validated_at: '2026-08-27T10:30:00Z'
      }
    },
    {
      id: 102,
      campaign_id: 1,
      campaign_title: 'Audit Présence PLV Boissons Sobbra',
      title: 'Alimentation du Faso — Dassasgho',
      location_name: 'Dassasgho, Rue 29.14',
      latitude: 12.3789,
      longitude: -1.4921,
      reward: 2500,
      status: 'submitted',
      assigned_user: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 }
    }
  ];

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        LoginComponent,
        CampaignsListComponent,
        CampaignWizardComponent,
        CampaignTrackingComponent,
        ExportsHistoryComponent,
        CompanySettingsComponent,
        BusinessLayoutComponent
      ],
      providers: [
        AuthService,
        CampaignBusinessService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: () => '1' })
          }
        }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    campaignService = TestBed.inject(CampaignBusinessService);
    campaignService.campaigns.set(mockCampaigns);
    campaignService.currentResultsMap.set(mockPoints);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('Journey Step 1: Authentication & Company Identity Selection', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const loginComp = fixture.componentInstance;
    fixture.detectChanges();

    expect(loginComp.email).toBe('business@sobbra.bf');
    expect(loginComp.password).toBe('Password123!');

    // Mock successful login call
    spyOn(authService, 'login').and.callFake((creds) => {
      if (creds.email.includes('orange')) {
        authService.currentUser.set({
          id: 4,
          name: 'Directeur Réseau Orange',
          email: 'business@orange.bf',
          company_name: 'Orange Burkina SA',
          role: 'company-admin',
          city: 'Ouagadougou'
        });
      } else {
        authService.currentUser.set({
          id: 3,
          name: 'Jean-Marc Somé',
          email: 'business@sobbra.bf',
          company_name: 'Sobbra Distribution BF',
          role: 'company-admin',
          city: 'Ouagadougou'
        });
      }
      authService.token.set('mock-valid-token');
      return of(true);
    });

    // Switch to Orange Burkina preset
    loginComp.loginWithPreset('business@orange.bf');
    expect(loginComp.email).toBe('business@orange.bf');
    expect(authService.currentUser()?.company_name).toBe('Orange Burkina SA');

    // Login with Sobbra credentials
    loginComp.loginWithPreset('business@sobbra.bf');
    expect(authService.isAuthenticated()).toBeTrue();
    expect(authService.currentUser()?.company_name).toBe('Sobbra Distribution BF');
  });

  it('Journey Step 2: Dashboard Overview & Campaign Browsing', () => {
    authService.setDefaultUser();
    const fixture = TestBed.createComponent(CampaignsListComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    expect(comp.campaignService.campaigns().length).toBe(2);
    
    // Filter active
    comp.setFilter('active');
    expect(comp.activeFilter).toBe('active');
    expect(comp.filteredCampaigns.every((c: Campaign) => c.status === 'active')).toBeTrue();
    expect(comp.filteredCampaigns.length).toBe(1);

    // Filter completed
    comp.setFilter('completed');
    expect(comp.activeFilter).toBe('completed');
    expect(comp.filteredCampaigns.every((c: Campaign) => c.status === 'completed')).toBeTrue();
    expect(comp.filteredCampaigns.length).toBe(1);

    // Reset filter
    comp.setFilter('all');
    expect(comp.filteredCampaigns.length).toBe(2);
  });

  it('Journey Step 3: End-to-End Campaign Creation & Budget Calculation', () => {
    authService.setDefaultUser();
    const fixture = TestBed.createComponent(CampaignWizardComponent);
    const wizard = fixture.componentInstance;
    fixture.detectChanges();

    // Mock API services
    const mockCreatedCampaign: Campaign = {
      id: 99,
      title: 'Audit Visibilité PLV — Campagne E2E',
      company_name: 'Sobbra Distribution BF',
      description: 'Contrôle terrain affiches et réfrigérateurs',
      type: 'audit',
      city: 'Ouagadougou',
      target_neighborhoods: 'Koulouba, Ouaga 2000',
      missions_count: 40,
      reward_per_mission: 2500,
      total_budget: 115000,
      status: 'pending'
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

    // Step 1: Definition
    wizard.title.set('Audit Visibilité PLV — Campagne E2E');
    wizard.description.set('Contrôle terrain affiches et réfrigérateurs');
    wizard.selectMissionType('audit');
    wizard.nextStep();
    expect(wizard.currentStep()).toBe(2);

    // Step 2: Zones
    wizard.selectAllNeighborhoods();
    expect(wizard.selectedNeighborhoods().length).toBe(wizard.allNeighborhoods.length);
    wizard.nextStep();
    expect(wizard.currentStep()).toBe(3);

    // Step 3: Dynamic Questionnaire Builder
    wizard.newQuestionLabel.set('Présence du présentoir de caisse');
    wizard.newQuestionType.set('select');
    wizard.newQuestionOptionsStr.set('Conforme, Non Conforme, Absent');
    wizard.addQuestion();
    expect(wizard.questions().some(q => q.label === 'Présence du présentoir de caisse')).toBeTrue();
    wizard.nextStep();
    expect(wizard.currentStep()).toBe(4);

    // Step 4: Budget & Payment Simulation
    wizard.totalMissions.set(40);
    wizard.rewardPerMission.set(2500);
    // Subtotal: 40 * 2500 = 100,000 FCFA
    expect(wizard.subtotal()).toBe(100000);
    // Platform fee (15%): 15,000 FCFA
    expect(wizard.platformFee()).toBe(15000);
    // Total budget: 115,000 FCFA
    expect(wizard.totalBudget()).toBe(115000);

    // Submit Campaign
    wizard.submitCampaign();
    expect(campaignService.createCampaign).toHaveBeenCalled();
    expect(campaignService.payCampaign).toHaveBeenCalledWith(99, {
      payment_method: 'orange_money',
      phone_number: '+22670123456'
    });
    expect(wizard.currentStep()).toBe(5);
    expect(wizard.successMessage()).toContain('Campagne créée avec succès');
  });

  it('Journey Step 4: Real-Time Map Tracking & Drawer Exploration', () => {
    authService.setDefaultUser();
    const fixture = TestBed.createComponent(CampaignTrackingComponent);
    const tracking = fixture.componentInstance;
    fixture.detectChanges();

    expect(tracking.campaignId()).toBe(1);
    expect(tracking.filteredPoints().length).toBe(2);

    // Filter by validated pins
    tracking.setStatusFilter('validated');
    const validatedPoints = tracking.filteredPoints();
    expect(validatedPoints.length).toBe(1);

    // Inspect validated point
    tracking.selectPoint(validatedPoints[0]);
    expect(tracking.isDrawerOpen()).toBeTrue();
    expect(tracking.selectedPoint()?.status).toBe('validated');
    expect(tracking.selectedPoint()?.location_name).toContain('Patte d\'Oie');

    tracking.closeDrawer();
    expect(tracking.isDrawerOpen()).toBeFalse();
  });

  it('Journey Step 5: Data Export Generation & History Logging', () => {
    authService.setDefaultUser();
    spyOn(campaignService, 'downloadCampaignExport').and.returnValue(of(true));

    const fixture = TestBed.createComponent(ExportsHistoryComponent);
    const exportsComp = fixture.componentInstance;
    fixture.detectChanges();

    const initialHistoryCount = exportsComp.exportHistory().length;
    expect(initialHistoryCount).toBeGreaterThan(0);

    // Trigger instant CSV export
    exportsComp.downloadExport(1, 'csv');
    expect(campaignService.downloadCampaignExport).toHaveBeenCalledWith(1, 'csv');
    expect(exportsComp.exportHistory().length).toBe(initialHistoryCount + 1);
    expect(exportsComp.toastMessage()).toContain('CSV généré et téléchargé');

    // Trigger Excel export
    exportsComp.downloadExport(1, 'excel');
    expect(campaignService.downloadCampaignExport).toHaveBeenCalledWith(1, 'excel');
    expect(exportsComp.exportHistory().length).toBe(initialHistoryCount + 2);
    expect(exportsComp.toastMessage()).toContain('EXCEL généré et téléchargé');
  });

  it('Journey Step 6: Company Settings, Mobile Money & API Key Management', () => {
    authService.setDefaultUser();
    const fixture = TestBed.createComponent(CompanySettingsComponent);
    const settings = fixture.componentInstance;
    fixture.detectChanges();

    // Tab Navigation
    settings.activeTab.set('billing');
    expect(settings.activeTab()).toBe('billing');

    settings.activeTab.set('api');
    expect(settings.activeTab()).toBe('api');

    // API Key Regeneration
    const oldKey = settings.apiKey();
    settings.regenerateApiKey();
    expect(settings.apiKey()).not.toBe(oldKey);
    expect(settings.apiKey().startsWith('sapsap_live_')).toBeTrue();
    expect(settings.toastMessage()).toContain('Nouvelle clé API générée');

    // Settings Save
    settings.activeTab.set('profile');
    settings.phone.set('+226 70 99 88 77');
    settings.saveProfile();
    expect(settings.toastMessage()).toContain('Informations de l\'entreprise mises à jour');
  });

  it('Journey Step 7: Layout Controls & Safe Logout', () => {
    authService.setDefaultUser();
    const fixture = TestBed.createComponent(BusinessLayoutComponent);
    const layout = fixture.componentInstance;
    fixture.detectChanges();

    expect(authService.currentUser()?.company_name).toBe('Sobbra Distribution BF');
    expect(layout.isSidebarCollapsed).toBeFalse();

    // Toggle sidebar
    layout.toggleSidebar();
    expect(layout.isSidebarCollapsed).toBeTrue();

    // Switch demo company on the fly
    spyOn(authService, 'login').and.callFake((creds) => {
      authService.currentUser.set({
        id: 4,
        name: 'Directeur Réseau Orange',
        email: 'business@orange.bf',
        company_name: 'Orange Burkina SA',
        role: 'company-admin',
        city: 'Ouagadougou'
      });
      return of(true);
    });

    layout.switchCompany('orange');
    expect(authService.currentUser()?.company_name).toBe('Orange Burkina SA');

    // Logout
    spyOn(authService, 'logout').and.callFake(() => {
      authService.currentUser.set(null);
      authService.token.set(null);
    });

    layout.onLogout();
    expect(authService.logout).toHaveBeenCalled();
    expect(authService.isAuthenticated()).toBeFalse();
    expect(authService.currentUser()).toBeNull();
  });
});
