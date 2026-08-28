import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { CampaignTrackingComponent } from './campaign-tracking.component';
import { CampaignBusinessService } from '../../../core/services/campaign-business.service';
import { ResultPoint, TrackingData } from '../../../core/models/campaign.model';

describe('CampaignTrackingComponent (QA Real-Time Map & Data Inspection E2E Test)', () => {
  let component: CampaignTrackingComponent;
  let fixture: ComponentFixture<CampaignTrackingComponent>;
  let campaignService: CampaignBusinessService;

  const mockPoints: ResultPoint[] = [
    {
      id: 1,
      campaign_id: 1,
      campaign_title: 'Audit Sobbra',
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
          'Affiches publicitaires visibles': 'Oui, grande bâche PLV Sobbra',
          'Frigos opérationnels': '2 réfrigérateurs vitrés'
        },
        photos: ['https://example.com/photo1.jpg'],
        created_at: '2026-08-27T10:15:00Z',
        validated_at: '2026-08-27T10:30:00Z'
      }
    },
    {
      id: 2,
      campaign_id: 1,
      campaign_title: 'Audit Sobbra',
      title: 'Bar Le Faso — Dassasgho',
      location_name: 'Dassasgho, Rue 29.14',
      latitude: 12.3789,
      longitude: -1.4921,
      reward: 2500,
      status: 'submitted',
      assigned_user: { id: 2, name: 'Amina Sawadogo', reputation_score: 94 }
    },
    {
      id: 3,
      campaign_id: 1,
      campaign_title: 'Audit Sobbra',
      title: 'Kiosque Ouaga 2000',
      location_name: 'Ouaga 2000 Sud',
      latitude: 12.3100,
      longitude: -1.5000,
      reward: 2500,
      status: 'available'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, CampaignTrackingComponent],
      providers: [
        CampaignBusinessService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => '1' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignTrackingComponent);
    component = fixture.componentInstance;
    campaignService = TestBed.inject(CampaignBusinessService);
    campaignService.currentResultsMap.set(mockPoints);
    fixture.detectChanges();
  });

  it('should initialize and load campaign data based on route param', () => {
    expect(component).toBeTruthy();
    expect(component.campaignId()).toBe(1);
    expect(component.filteredPoints().length).toBe(3);
  });

  it('should filter points by status, neighborhood and search query', () => {
    // Filter status
    component.setStatusFilter('validated');
    expect(component.filteredPoints().length).toBe(1);
    expect(component.filteredPoints()[0].id).toBe(1);

    // Reset status and filter neighborhood
    component.setStatusFilter('all');
    component.setNeighborhoodFilter('Dassasgho');
    expect(component.filteredPoints().length).toBe(1);
    expect(component.filteredPoints()[0].id).toBe(2);

    // Search query
    component.setNeighborhoodFilter('all');
    component.searchQuery.set('Moussa');
    expect(component.filteredPoints().length).toBe(1);
    expect(component.filteredPoints()[0].assigned_user?.name).toBe('Moussa Ouédraogo');
  });

  it('should calculate geographic percentage positions within Ouagadougou bounds', () => {
    const point = mockPoints[0];
    const pos = component.getPointPosition(point);

    expect(pos.left).toContain('%');
    expect(pos.top).toContain('%');

    const leftVal = parseFloat(pos.left);
    const topVal = parseFloat(pos.top);
    expect(leftVal).toBeGreaterThan(0);
    expect(leftVal).toBeLessThan(100);
    expect(topVal).toBeGreaterThan(0);
    expect(topVal).toBeLessThan(100);
  });

  it('should select point and open inspection drawer', () => {
    component.selectPoint(mockPoints[0]);
    expect(component.selectedPoint()).toEqual(mockPoints[0]);
    expect(component.isDrawerOpen()).toBeTrue();

    component.closeDrawer();
    expect(component.isDrawerOpen()).toBeFalse();
  });

  it('should navigate through points with previous and next actions', () => {
    component.setStatusFilter('all');
    component.selectPoint(mockPoints[0]);

    component.selectNextPoint();
    expect(component.selectedPoint()?.id).toBe(2);

    component.selectNextPoint();
    expect(component.selectedPoint()?.id).toBe(3);

    component.selectPrevPoint();
    expect(component.selectedPoint()?.id).toBe(2);
  });

  it('should manage photo lightbox zoom', () => {
    const testUrl = 'https://example.com/zoom.jpg';
    component.openZoom(testUrl);
    expect(component.zoomedPhoto()).toBe(testUrl);

    component.closeZoom();
    expect(component.zoomedPhoto()).toBeNull();
  });

  it('should open and trigger campaign export (Story 5.3)', () => {
    spyOn(campaignService, 'downloadCampaignExport').and.returnValue(of(true));

    component.openExportModal('excel');
    expect(component.isExportModalOpen()).toBeTrue();
    expect(component.exportFormat()).toBe('excel');

    component.setExportStatusScope('validated');
    component.triggerExport();

    expect(campaignService.downloadCampaignExport).toHaveBeenCalled();
    expect(component.isExportModalOpen()).toBeFalse();
    expect(component.toastMessage()).toContain('téléchargé avec succès');
  });
});
