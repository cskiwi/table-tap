import { Injectable, NgZone } from '@angular/core';
import { Observable, BehaviorSubject, interval, combineLatest } from 'rxjs';
import { map, filter, switchMap, takeWhile } from 'rxjs/operators';
import { TimerState, KitchenOrder } from '../types';
import { OfflineStorageService } from './storage/offline-storage.service';
import { OfflineSyncService } from './sync/offline-sync.service';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private timers$ = new BehaviorSubject<Map<string, TimerState>>(new Map());
  private activeTimers$ = new BehaviorSubject<string[]>([]);

  constructor(
    private storage: OfflineStorageService,
    private syncService: OfflineSyncService,
    private ngZone: NgZone
  ) {
    this.initializeTimers()
  }

  get timers(): Observable<Map<string, TimerState>> {
    return this.timers$.asObservable()
  }

  get activeTimers(): Observable<string[]> {
    return this.activeTimers$.asObservable()
  }

  private async initializeTimers(): Promise<void> {
    // Load persisted timers from storage
    await this.storage.isReady$.pipe(
      filter(ready => ready),
      switchMap(() => this.loadPersistedTimers())
    ).toPromise()

    // Start update loop
    this.ngZone.runOutsideAngular(() => {
      interval(1000).subscribe(() => {
        this.ngZone.run(() => {
          this.updateTimers()
        });
      });
    });
  }

  private async loadPersistedTimers(): Promise<void> {
    try {
      const storedTimers = await this.storage.getAllTimers()
      const timersMap = new Map<string, TimerState>()

      for (const timer of storedTimers) {
        // Recalculate elapsed time for running timers
        if (timer.isRunning && !timer.isPaused) {
          const now = Date.now()
          timer.remainingTime = Math.max(0, timer.duration - (now - timer.startTime));
        }
        timersMap.set(timer.orderId, timer);
      }

      this.timers$.next(timersMap);
      this.updateActiveTimers()
    } catch (error) {
      console.error('Failed to load persisted timers:', error);
    }
  }

  async startTimer(orderId: string, duration: number): Promise<void> {
    const now = Date.now()
    const timer: TimerState = {
      orderId,
      startTime: now,
      duration,
      isRunning: true,
      isPaused: false,
      remainingTime: duration
    }

    await this.updateTimer(timer);

    // Queue sync operation
    await this.syncService.queueOperation({
      id: `timer_start_${orderId}_${now}`,
      type: 'timer_start' as any,
      data: { orderId, duration, startTime: now },
      timestamp: new Date(),
      status: 'pending' as any,
      retryCount: 0
    });
  }

  async stopTimer(orderId: string): Promise<void> {
    const timers = this.timers$.value;
    const timer = timers.get(orderId);

    if (!timer) return;

    const stoppedTimer: TimerState = {
      ...timer,
      isRunning: false,
      isPaused: false,
      remainingTime: 0
    }

    await this.updateTimer(stoppedTimer);

    // Queue sync operation
    await this.syncService.queueOperation({
      id: `timer_stop_${orderId}_${Date.now()}`,
      type: 'timer_stop' as any,
      data: { orderId, stopTime: Date.now(), elapsedTime: timer.duration - timer.remainingTime },
      timestamp: new Date(),
      status: 'pending' as any,
      retryCount: 0
    });

    // Remove from storage after a delay to allow sync
    setTimeout(async () => {
      await this.storage.deleteTimer(orderId);
      const updatedTimers = new Map(this.timers$.value);
      updatedTimers.delete(orderId);
      this.timers$.next(updatedTimers);
      this.updateActiveTimers()
    }, 5000);
  }

  async pauseTimer(orderId: string): Promise<void> {
    const timers = this.timers$.value;
    const timer = timers.get(orderId);

    if (!timer || !timer.isRunning || timer.isPaused) return;

    const pausedTimer: TimerState = {
      ...timer,
      isPaused: true
    }

    await this.updateTimer(pausedTimer);
  }

  async resumeTimer(orderId: string): Promise<void> {
    const timers = this.timers$.value;
    const timer = timers.get(orderId);

    if (!timer || !timer.isRunning || !timer.isPaused) return;

    const now = Date.now()
    const resumedTimer: TimerState = {
      ...timer,
      startTime: now - (timer.duration - timer.remainingTime),
      isPaused: false
    }

    await this.updateTimer(resumedTimer);
  }

  async resetTimer(orderId: string): Promise<void> {
    const timers = this.timers$.value;
    const timer = timers.get(orderId);

    if (!timer) return;

    const resetTimer: TimerState = {
      ...timer,
      startTime: Date.now(),
      isRunning: false,
      isPaused: false,
      remainingTime: timer.duration
    }

    await this.updateTimer(resetTimer);
  }

  async addTime(orderId: string, additionalSeconds: number): Promise<void> {
    const timers = this.timers$.value;
    const timer = timers.get(orderId);

    if (!timer) return;

    const additionalMs = additionalSeconds * 1000;
    const updatedTimer: TimerState = {
      ...timer,
      duration: timer.duration + additionalMs,
      remainingTime: timer.remainingTime + additionalMs
    }

    await this.updateTimer(updatedTimer);
  }

  getTimer(orderId: string): Observable<TimerState | undefined> {
    return this.timers$.pipe(
      map(timers => timers.get(orderId))
    );
  }

  getActiveTimersForOrder(orderId: string): Observable<TimerState[]> {
    return this.timers$.pipe(
      map(timers => {
        const orderTimers: TimerState[] = []
        for (const [timerOrderId, timer] of timers) {
          if (timerOrderId === orderId && timer.isRunning) {
            orderTimers.push(timer);
          }
        }
        return orderTimers;
      })
    );
  }

  getExpiredTimers(): Observable<TimerState[]> {
    return this.timers$.pipe(
      map(timers => {
        const expired: TimerState[] = []
        for (const timer of timers.values()) {
          if (timer.isRunning && !timer.isPaused && timer.remainingTime <= 0) {
            expired.push(timer);
          }
        }
        return expired;
      })
    );
  }

  getTimersNearExpiry(thresholdSeconds = 60): Observable<TimerState[]> {
    const thresholdMs = thresholdSeconds * 1000;

    return this.timers$.pipe(
      map(timers => {
        const nearExpiry: TimerState[] = []
        for (const timer of timers.values()) {
          if (
            timer.isRunning &&
            !timer.isPaused &&
            timer.remainingTime > 0 &&
            timer.remainingTime <= thresholdMs
          ) {
            nearExpiry.push(timer);
          }
        }
        return nearExpiry;
      })
    );
  }

  private async updateTimer(timer: TimerState): Promise<void> {
    // Update in-memory state
    const timers = new Map(this.timers$.value);
    timers.set(timer.orderId, timer);
    this.timers$.next(timers);

    // Persist to storage
    await this.storage.saveTimer(timer);

    // Update active timers list
    this.updateActiveTimers()
  }

  private updateTimers(): void {
    const timers = this.timers$.value;
    let hasUpdates = false;

    for (const [orderId, timer] of timers) {
      if (timer.isRunning && !timer.isPaused) {
        const now = Date.now()
        const elapsed = now - timer.startTime;
        const newRemainingTime = Math.max(0, timer.duration - elapsed);

        if (newRemainingTime !== timer.remainingTime) {
          timer.remainingTime = newRemainingTime;
          hasUpdates = true;

          // Auto-stop expired timers
          if (newRemainingTime === 0) {
            timer.isRunning = false;
          }
        }
      }
    }

    if (hasUpdates) {
      this.timers$.next(new Map(timers));
    }
  }

  private updateActiveTimers(): void {
    const timers = this.timers$.value;
    const activeIds = Array.from(timers.values())
      .filter(timer => timer.isRunning)
      .map(timer => timer.orderId);

    this.activeTimers$.next(activeIds);
  }

  // Preset timer durations for common items
  getPresetDurations(): { name: string; duration: number }[] {
    return [
      { name: 'Burger', duration: 8 * 60 * 1000 }, // 8 minutes
      { name: 'Fries', duration: 4 * 60 * 1000 }, // 4 minutes
      { name: 'Chicken', duration: 12 * 60 * 1000 }, // 12 minutes
      { name: 'Fish', duration: 6 * 60 * 1000 }, // 6 minutes
      { name: 'Pasta', duration: 10 * 60 * 1000 }, // 10 minutes
      { name: 'Pizza', duration: 15 * 60 * 1000 }, // 15 minutes
      { name: 'Salad', duration: 3 * 60 * 1000 }, // 3 minutes
      { name: 'Soup', duration: 5 * 60 * 1000 }, // 5 minutes
      { name: 'Steak', duration: 10 * 60 * 1000 }, // 10 minutes
      { name: 'Custom', duration: 0 } // User-defined
    ];
  }

  // Format remaining time for display
  formatTime(remainingTime: number): string {
    if (remainingTime <= 0) return '00:00';

    const totalSeconds = Math.ceil(remainingTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Get timer progress percentage
  getProgress(timer: TimerState): number {
    if (timer.duration === 0) return 0;
    const elapsed = timer.duration - timer.remainingTime;
    return Math.min(100, (elapsed / timer.duration) * 100);
  }

  // Bulk operations
  async stopAllTimers(): Promise<void> {
    const timers = this.timers$.value;
    for (const orderId of timers.keys()) {
      await this.stopTimer(orderId);
    }
  }

  async pauseAllTimers(): Promise<void> {
    const timers = this.timers$.value;
    for (const [orderId, timer] of timers) {
      if (timer.isRunning && !timer.isPaused) {
        await this.pauseTimer(orderId);
      }
    }
  }

  async resumeAllTimers(): Promise<void> {
    const timers = this.timers$.value;
    for (const [orderId, timer] of timers) {
      if (timer.isRunning && timer.isPaused) {
        await this.resumeTimer(orderId);
      }
    }
  }
}