import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CampaignsListComponent } from './campaigns-list.component';
import { CampaignBusinessService } from '../../../core/services/campaign-business.service';
import { Campaign, CampaignStats } from '../../../core/models/campaign.model';

describe('CampaignsListComponent (QA Campaigns Dashboard & Filters Test)', () => {
  let component: CampaignsListComponent;
  let fixture: ComponentFixture<CampaignsListComponent>;
  let campaignService: CampaignBusinessService;

  const mockCampaigns: Campaign[] = [
    {
      id: 1,
      title: 'Audit Sobbra',
      company_name: 'Sobbra Distribution BF',
      description: 'Audit PLV',
      type: 'Audit & Présence',
      city: 'Ouagadougou',
      target_neighborhoods: 'Patte d\'Oie',
      missions_count: 20,
      reward_per_mission: 2500,
      total_budget: 50000,
      status: 'active',
      completed_missions: 14,
      progress_percent: 70
    },
    {
      id: 2,
      title: 'Kiosques Orange Money',
      company_name: 'Orange Burkina SA',
      description: 'Contrôle tarifs',
      type: 'Vérification',
      city: 'Ouagadougou',
      target_neighborhoods: 'Ouaga 2000',
      missions_count: 50,
      reward_per_mission: 2000,
      total_budget: 100000,
      status: 'pending',
      completed_missions: 0,
      progress_percent: 0
    },
    {
      id: 3,
      title: 'Relevé Carburant Terminé',
      company_name: 'Total BF',
      description: 'Prix essences',
      type: 'Relevé',
      city: 'Ouagadougou',
      target_neighborhoods: 'Pissy',
      missions_count: 30,
      reward_per_mission: 1500,
      total_budget: 45000,
      status: 'completed',
      completed_missions: 30,
      progress_percent: 100
    }
  ];

  const mockStats: CampaignStats = {
    total_campaigns: 3,
    active_campaigns: 1,
    total_missions_target: 100,
    total_missions_completed: 44,
    total_budget_allocated: 195000,
    total_budget_spent: 80000
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, CampaignsListComponent],
      providers: [
        CampaignBusinessService,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignsListComponent);
    component = fixture.componentInstance;
    campaignService = TestBed.inject(CampaignBusinessService);
    campaignService.campaigns.set(mockCampaigns);
    campaignService.stats.set(mockStats);
    fixture.detectChanges();
  });

  it('should initialize CampaignsListComponent and load campaigns', () => {
    expect(component).toBeTruthy();
    expect(component.activeFilter).toBe('all');
    expect(component.filteredCampaigns.length).toBe(3);
  });

  it('should filter campaigns by active status correctly', () => {
    component.setFilter('active');
    expect(component.activeFilter).toBe('active');
    expect(component.filteredCampaigns.length).toBe(1);
    expect(component.filteredCampaigns[0].id).toBe(1);

    component.setFilter('pending');
    expect(component.filteredCampaigns.length).toBe(1);
    expect(component.filteredCampaigns[0].id).toBe(2);

    component.setFilter('completed');
    expect(component.filteredCampaigns.length).toBe(1);
    expect(component.filteredCampaigns[0].id).toBe(3);

    component.setFilter('all');
    expect(component.filteredCampaigns.length).toBe(3);
  });

  it('should open and close the campaign creation wizard modal', () => {
    expect(component.isWizardOpen()).toBeFalse();

    component.openWizard();
    expect(component.isWizardOpen()).toBeTrue();

    component.closeWizard();
    expect(component.isWizardOpen()).toBeFalse();
  });

  it('should handle campaign creation completion with toast and reload', () => {
    spyOn(campaignService, 'loadCampaigns').and.returnValue(of({ success: true, data: mockCampaigns, stats: mockStats }));

    component.onCampaignCreated(99);

    expect(component.toastMessage()).toContain('Campagne créée avec succès');
    expect(campaignService.loadCampaigns).toHaveBeenCalled();
  });

  it('should trigger campaign direct export download (Story 5.3)', () => {
    spyOn(campaignService, 'downloadCampaignExport').and.returnValue(of(true));
    const mockEvent = new MouseEvent('click');
    spyOn(mockEvent, 'stopPropagation');

    component.exportCampaign(1, 'csv', mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(campaignService.downloadCampaignExport).toHaveBeenCalledWith(1, 'csv');
    expect(component.toastMessage()).toContain('Export CSV téléchargé');
  });

  it('should format prices in FCFA format correctly', () => {
    const formatted = component.formatPrice(50000);
    expect(formatted).toMatch(/50[\s\u202F]000|50000/);
  });
});
