import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { BusinessLayoutComponent } from './business-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { CampaignBusinessService } from '../../core/services/campaign-business.service';

describe('BusinessLayoutComponent (QA Layout & Header/Sidebar Navigation Test)', () => {
  let component: BusinessLayoutComponent;
  let fixture: ComponentFixture<BusinessLayoutComponent>;
  let authService: AuthService;
  let campaignService: CampaignBusinessService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, BusinessLayoutComponent],
      providers: [
        AuthService,
        CampaignBusinessService,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessLayoutComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    campaignService = TestBed.inject(CampaignBusinessService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should initialize layout with active business session', () => {
    expect(component).toBeTruthy();
    expect(component.isSidebarCollapsed).toBeFalse();
    expect(authService.currentUser()?.company_name).toBe('Sobbra Distribution BF');
  });

  it('should toggle sidebar collapsed state', () => {
    component.toggleSidebar();
    expect(component.isSidebarCollapsed).toBeTrue();

    component.toggleSidebar();
    expect(component.isSidebarCollapsed).toBeFalse();
  });

  it('should switch demo company context and reload campaigns', () => {
    spyOn(authService, 'login').and.returnValue(of(true));
    spyOn(campaignService, 'loadCampaigns').and.returnValue(of({ success: true, data: [], stats: { total_campaigns: 0, active_campaigns: 0, total_missions_target: 0, total_missions_completed: 0, total_budget_allocated: 0, total_budget_spent: 0 } }));

    component.switchCompany('orange');

    expect(authService.login).toHaveBeenCalledWith({
      email: 'business@orange.bf',
      password: 'Password123!'
    });
    expect(campaignService.loadCampaigns).toHaveBeenCalled();
  });

  it('should trigger logout and redirect to login page', () => {
    spyOn(authService, 'logout');
    spyOn(router, 'navigate');

    component.onLogout();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
