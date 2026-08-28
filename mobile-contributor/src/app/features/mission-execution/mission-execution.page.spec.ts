import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular/lazy';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MissionExecutionPage } from './mission-execution.page';
import { MissionService } from '../../core/services/mission.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { CameraService } from '../../core/services/camera.service';
import { OfflineQueueService } from '../../core/services/offline-queue.service';

describe('MissionExecutionPage', () => {
  let component: MissionExecutionPage;
  let fixture: ComponentFixture<MissionExecutionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MissionExecutionPage],
      imports: [
        IonicModule.forRoot(),
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        MissionService,
        GeolocationService,
        CameraService,
        OfflineQueueService
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MissionExecutionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create MissionExecutionPage', () => {
    expect(component).toBeTruthy();
  });

  it('should enforce GPS proximity before allowing submission', () => {
    component.isWithinRadius = false;
    component.capturedPhotos = [];
    expect(component.canSubmit()).toBe(false);

    component.isWithinRadius = true;
    component.capturedPhotos = [
      {
        dataUrl: 'data:image/jpeg;base64,...',
        sizeBytes: 12000,
        width: 800,
        height: 600,
        timestamp: new Date().toISOString()
      }
    ];
    expect(component.canSubmit()).toBe(true);
  });
});
