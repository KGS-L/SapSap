import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ExportsHistoryComponent } from './exports-history.component';
import { CampaignBusinessService } from '../../../core/services/campaign-business.service';
import { Campaign } from '../../../core/models/campaign.model';

describe('ExportsHistoryComponent (QA Exports & Reports History E2E Test)', () => {
  let component: ExportsHistoryComponent;
  let fixture: ComponentFixture<ExportsHistoryComponent>;
  let campaignService: CampaignBusinessService;

  const mockCampaign: Campaign = {
    id: 1,
    title: 'Audit Présence PLV Boissons Sobbra',
    company_name: 'Sobbra Distribution BF',
    description: 'Audit PLV',
    type: 'Audit & Présence',
    city: 'Ouagadougou',
    target_neighborhoods: 'Patte d\'Oie',
    missions_count: 20,
    reward_per_mission: 2500,
    total_budget: 50000,
    status: 'active',
    completed_missions: 14
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ExportsHistoryComponent],
      providers: [
        CampaignBusinessService,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExportsHistoryComponent);
    component = fixture.componentInstance;
    campaignService = TestBed.inject(CampaignBusinessService);
    campaignService.campaigns.set([mockCampaign]);
    fixture.detectChanges();
  });

  it('should initialize with existing export history entries', () => {
    expect(component).toBeTruthy();
    expect(component.exportHistory().length).toBeGreaterThan(0);
    expect(component.exportHistory()[0].format).toBe('csv');
  });

  it('should generate new CSV export and add record to history table', () => {
    spyOn(campaignService, 'downloadCampaignExport').and.returnValue(of(true));
    const initialCount = component.exportHistory().length;

    component.downloadExport(1, 'csv');

    expect(campaignService.downloadCampaignExport).toHaveBeenCalledWith(1, 'csv');
    expect(component.exportHistory().length).toBe(initialCount + 1);
    expect(component.exportHistory()[0].campaign_id).toBe(1);
    expect(component.exportHistory()[0].format).toBe('csv');
    expect(component.toastMessage()).toContain('généré et téléchargé avec succès');
  });

  it('should generate new Excel export and add record to history table', () => {
    spyOn(campaignService, 'downloadCampaignExport').and.returnValue(of(true));
    const initialCount = component.exportHistory().length;

    component.downloadExport(1, 'excel');

    expect(campaignService.downloadCampaignExport).toHaveBeenCalledWith(1, 'excel');
    expect(component.exportHistory().length).toBe(initialCount + 1);
    expect(component.exportHistory()[0].format).toBe('excel');
    expect(component.exportHistory()[0].file_size_kb).toBe(31.0);
  });
});
