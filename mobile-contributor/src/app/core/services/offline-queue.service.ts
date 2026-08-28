import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SubmissionPayload } from '../models/mission.model';

export interface QueuedSubmission {
  id: string;
  missionId: number;
  missionTitle: string;
  payload: SubmissionPayload;
  queuedAt: string;
  retryCount: number;
  lastError?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {
  private readonly QUEUE_KEY = 'sapsap_offline_submissions';

  private queueSubject = new BehaviorSubject<QueuedSubmission[]>([]);
  public queue$ = this.queueSubject.asObservable();

  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$ = this.isOnlineSubject.asObservable();

  constructor() {
    this.loadStoredQueue();
    this.initNetworkListeners();
  }

  private initNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnlineSubject.next(true);
    });

    window.addEventListener('offline', () => {
      this.isOnlineSubject.next(false);
    });
  }

  private loadStoredQueue(): void {
    const raw = localStorage.getItem(this.QUEUE_KEY);
    if (raw) {
      try {
        this.queueSubject.next(JSON.parse(raw));
      } catch {
        this.queueSubject.next([]);
      }
    }
  }

  public enqueue(missionId: number, missionTitle: string, payload: SubmissionPayload, lastError?: string): QueuedSubmission {
    const item: QueuedSubmission = {
      id: 'queue_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      missionId,
      missionTitle,
      payload,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
      lastError
    };

    const current = [item, ...this.queueSubject.value];
    this.queueSubject.next(current);
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(current));
    return item;
  }

  public dequeue(id: string): void {
    const filtered = this.queueSubject.value.filter(q => q.id !== id);
    this.queueSubject.next(filtered);
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(filtered));
  }

  public get pendingCount(): number {
    return this.queueSubject.value.length;
  }

  public get isOnline(): boolean {
    return this.isOnlineSubject.value;
  }
}
