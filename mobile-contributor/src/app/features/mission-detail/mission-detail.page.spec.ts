import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MissionDetailPage } from './mission-detail.page';
import { MissionService } from '../../core/services/mission.service';
import { GeolocationService } from '../../core/services/geolocation.service';

describe('MissionDetailPage', () => {
  let component: MissionDetailPage;
  let fixture: ComponentFixture<MissionDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MissionDetailPage],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [MissionService, GeolocationService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MissionDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create MissionDetailPage', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize mission details properly', () => {
    expect(component.mission).toBeTruthy();
    expect(component.mission?.reward_amount).toBeGreaterThan(0);
  });
});
