import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivityPage } from './activity.page';
import { MissionService } from '../../core/services/mission.service';

describe('ActivityPage', () => {
  let component: ActivityPage;
  let fixture: ComponentFixture<ActivityPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActivityPage],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [MissionService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ActivityPage', () => {
    expect(component).toBeTruthy();
  });

  it('should filter submissions by segment', () => {
    component.selectedSegment = 'validated';
    component.applyFilter();
    expect(component.filteredSubmissions.every(s => s.status === 'validated')).toBe(true);
  });
});
