import { Component, OnInit } from '@angular/core';
import { MissionService } from '../../core/services/mission.service';
import { OfflineQueueService } from '../../core/services/offline-queue.service';
import { Observable } from 'rxjs';
import { ReservationResponse } from '../../core/models/mission.model';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: false
})
export class TabsPage implements OnInit {
  activeReservation$: Observable<ReservationResponse | null>;
  isOnline$: Observable<boolean>;

  constructor(
    private missionService: MissionService,
    private offlineQueue: OfflineQueueService
  ) {
    this.activeReservation$ = this.missionService.activeReservation$;
    this.isOnline$ = this.offlineQueue.isOnline$;
  }

  ngOnInit(): void {}
}
