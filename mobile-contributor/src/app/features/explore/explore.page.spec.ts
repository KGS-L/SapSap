import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ExplorePage } from './explore.page';
import { MissionService } from '../../core/services/mission.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { AuthService } from '../../core/services/auth.service';

describe('ExplorePage', () => {
  let component: ExplorePage;
  let fixture: ComponentFixture<ExplorePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExplorePage],
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [MissionService, GeolocationService, AuthService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ExplorePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ExplorePage', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle between list and map views', () => {
    expect(component.viewMode).toBe('list');
    component.toggleViewMode('map');
    expect(component.viewMode).toBe('map');
  });

  it('should filter missions by category', () => {
    component.selectCategory('price_check');
    expect(component.selectedCategory).toBe('price_check');
  });
});
