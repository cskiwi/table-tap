import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, fromEvent, merge } from 'rxjs';
import { map, filter, switchMap, catchError, tap, debounceTime } from 'rxjs/operators';
import { OfflineStorageService } from '../storage/offline-storage.service';
import {
  SyncOperation,
  SyncStatus,
  SyncState,
  OfflineQueueItem,
  SyncOperationType,
  ConflictResolutionStrategy
} from '../../types';

@Injectable({
  providedIn: 'root',
})
export class OfflineSyncService {
  private syncState$ = new BehaviorSubject<SyncState>({
    isOnline: navigator.onLine,
    lastSyncTime: new Date(0),
    pendingOperations: 0,
    failedOperations: 0,
    isSync: false,
    queueSize: 0
  });

  private readonly API_BASE_URL = '/api/kitchen';
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  constructor(
    private http: HttpClient,
    private storage: OfflineStorageService,
    private ngZone: NgZone
  ) {
    this.initializeSync();
  }

  get state$(): Observable<SyncState> {
    return this.syncState$.asObservable()
  }

  get isOnline(): boolean {
    return this.syncState$.value.isOnline;
  }

  private initializeSync(): void {
    // Monitor online/offline status
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(online$, offline$).subscribe(isOnline => {
      this.updateSyncState({ isOnline });
      if (isOnline) {
        this.processSyncQueue()
      }
    });

    // Periodic sync when online
    interval(this.SYNC_INTERVAL)
      .pipe(filter(() => this.isOnline && !this.syncState$.value.isSync))
      .subscribe(() => this.processSyncQueue());

    // Process queue on storage ready
    this.storage.isReady$
      .pipe(filter(ready => ready))
      .subscribe(() => this.updateQueueSize());
  }

  async queueOperation(operation: SyncOperation): Promise<void> {
    operation.status = SyncStatus.PENDING;
    operation.timestamp = new Date()
    operation.retryCount = 0;

    await this.storage.addToSyncQueue(operation);
    this.updateQueueSize()

    // Try immediate sync if online
    if (this.isOnline) {
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => this.processSyncQueue(), 1000);
      });
    }
  }

  async processSyncQueue(): Promise<void> {
    if (this.syncState$.value.isSync || !this.isOnline) {
      return;
    }

    this.updateSyncState({ isSync: true });

    try {
      const queue = await this.storage.getSyncQueue()
      let pendingCount = 0;
      let failedCount = 0;

      for (const item of queue) {
        try {
          await this.processQueueItem(item);
          await this.storage.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error(`Failed to sync operation ${item.id}:`, error);

          item.operation.retryCount++;
          item.operation.error = error instanceof Error ? error.message : 'Unknown error';

          if (item.operation.retryCount >= this.MAX_RETRY_ATTEMPTS) {
            item.operation.status = SyncStatus.FAILED;
            failedCount++;
          } else {
            item.operation.status = SyncStatus.RETRY;
            item.scheduledFor = new Date(Date.now() + this.RETRY_DELAY);
            pendingCount++;
          }

          await this.storage.addToSyncQueue(item.operation);
        }
      }

      this.updateSyncState({
        lastSyncTime: new Date(),
        pendingOperations: pendingCount,
        failedOperations: failedCount,
        isSync: false
      });

      this.updateQueueSize()
    } catch (error) {
      console.error('Sync queue processing failed:', error);
      this.updateSyncState({ isSync: false });
    }
  }

  private async processQueueItem(item: OfflineQueueItem): Promise<void> {
    const { operation } = item;

    switch (operation.type) {
      case SyncOperationType.ORDER_UPDATE:
        await this.syncOrderUpdate(operation);
        break;
      case SyncOperationType.ORDER_STATUS_CHANGE:
        await this.syncOrderStatusChange(operation);
        break;
      case SyncOperationType.TIMER_START:
      case SyncOperationType.TIMER_STOP:
        await this.syncTimerOperation(operation);
        break;
      case SyncOperationType.INVENTORY_UPDATE:
        await this.syncInventoryUpdate(operation);
        break;
      case SyncOperationType.CONFIGURATION_UPDATE:
        await this.syncConfigurationUpdate(operation);
        break;
      case SyncOperationType.KITCHEN_STATS:
        await this.syncKitchenStats(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async syncOrderUpdate(operation: SyncOperation): Promise<void> {
    await this.http.put(`${this.API_BASE_URL}/orders/${operation.data.id}`, operation.data)
      .pipe(
        tap(response => this.handleSyncResponse(operation, response)),
        catchError(error => this.handleSyncError(operation, error))
      ).toPromise();
  }

  private async syncOrderStatusChange(operation: SyncOperation): Promise<void> {
    const { orderId, status, timestamp } = operation.data;

    await this.http.patch(`${this.API_BASE_URL}/orders/${orderId}/status`, {
      status,
      timestamp
    }).pipe(
      tap(response => this.handleSyncResponse(operation, response)),
      catchError(error => this.handleSyncError(operation, error))
    ).toPromise();
  }

  private async syncTimerOperation(operation: SyncOperation): Promise<void> {
    const endpoint = operation.type === SyncOperationType.TIMER_START
      ? 'start-timer'
      : 'stop-timer';

    await this.http.post(`${this.API_BASE_URL}/timers/${endpoint}`, operation.data)
      .pipe(
        tap(response => this.handleSyncResponse(operation, response)),
        catchError(error => this.handleSyncError(operation, error))
      ).toPromise();
  }

  private async syncInventoryUpdate(operation: SyncOperation): Promise<void> {
    await this.http.put(`${this.API_BASE_URL}/inventory/${operation.data.id}`, operation.data)
      .pipe(
        tap(response => this.handleSyncResponse(operation, response)),
        catchError(error => this.handleSyncError(operation, error))
      ).toPromise();
  }

  private async syncConfigurationUpdate(operation: SyncOperation): Promise<void> {
    await this.http.put(`${this.API_BASE_URL}/config`, operation.data)
      .pipe(
        tap(response => this.handleSyncResponse(operation, response)),
        catchError(error => this.handleSyncError(operation, error))
      ).toPromise();
  }

  private async syncKitchenStats(operation: SyncOperation): Promise<void> {
    await this.http.post(`${this.API_BASE_URL}/stats`, operation.data)
      .pipe(
        tap(response => this.handleSyncResponse(operation, response)),
        catchError(error => this.handleSyncError(operation, error))
      ).toPromise();
  }

  private handleSyncResponse(operation: SyncOperation, response: any): void {
    operation.status = SyncStatus.COMPLETED;

    // Handle potential conflicts
    if (response.conflict) {
      this.resolveConflict(operation, response.serverData);
    }
  }

  private handleSyncError(operation: SyncOperation, error: any): never {
    operation.status = SyncStatus.FAILED;
    operation.error = error.message || 'Sync failed';
    throw error;
  }

  private async resolveConflict(operation: SyncOperation, serverData: any): Promise<void> {
    const strategy = ConflictResolutionStrategy.TIMESTAMP_WINS; // Could be configurable

    if (strategy === ConflictResolutionStrategy.TIMESTAMP_WINS) {
      await this.resolveByTimestamp(operation, serverData);
    } else if (strategy === ConflictResolutionStrategy.SERVER_WINS) {
      await this.applyServerData(operation, serverData);
    } else if (strategy === ConflictResolutionStrategy.CLIENT_WINS) {
      // Keep local data, mark as resolved
    } else if (strategy === ConflictResolutionStrategy.MANUAL_RESOLVE) {
      await this.queueManualResolution(operation, serverData);
    }
  }

  private async applyServerData(operation: SyncOperation, serverData: any): Promise<void> {
    switch (operation.type) {
      case SyncOperationType.ORDER_UPDATE:
        await this.storage.saveOrder(serverData);
        break;
      case SyncOperationType.INVENTORY_UPDATE:
        await this.storage.saveInventoryItem(serverData);
        break;
      // Add other cases as needed
    }
  }

  private async resolveByTimestamp(operation: SyncOperation, serverData: any): Promise<void> {
    const clientTimestamp = new Date(operation.data.lastUpdated || operation.timestamp);
    const serverTimestamp = new Date(serverData.lastUpdated || serverData.updatedAt);

    if (serverTimestamp > clientTimestamp) {
      await this.applyServerData(operation, serverData);
    }
  }

  private async queueManualResolution(operation: SyncOperation, serverData: any): Promise<void> {
    // Store conflict for manual resolution
    await this.storage.saveConfig(`conflict_${operation.id}`, {
      operation: operation.data,
      serverData,
      timestamp: new Date()
    });
  }

  async forcePullFromServer(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      // Pull orders
      const orders = await this.http.get<any[]>(`${this.API_BASE_URL}/orders`).toPromise()
      if (orders) {
        await this.storage.saveOrders(orders);
      }

      // Pull inventory
      const inventory = await this.http.get<any[]>(`${this.API_BASE_URL}/inventory`).toPromise()
      if (inventory) {
        for (const item of inventory) {
          await this.storage.saveInventoryItem(item);
        }
      }

      this.updateSyncState({ lastSyncTime: new Date() });
    } catch (error) {
      console.error('Force pull failed:', error);
      throw error;
    }
  }

  private async updateQueueSize(): Promise<void> {
    const queue = await this.storage.getSyncQueue()
    this.updateSyncState({ queueSize: queue.length });
  }

  private updateSyncState(updates: Partial<SyncState>): void {
    const currentState = this.syncState$.value;
    this.syncState$.next({ ...currentState, ...updates });
  }

  async clearFailedOperations(): Promise<void> {
    const queue = await this.storage.getSyncQueue()
    const failedItems = queue.filter(item => item.operation.status === SyncStatus.FAILED);

    for (const item of failedItems) {
      await this.storage.removeFromSyncQueue(item.id);
    }

    this.updateSyncState({ failedOperations: 0 });
    this.updateQueueSize()
  }

  async retryFailedOperations(): Promise<void> {
    const queue = await this.storage.getSyncQueue()
    const failedItems = queue.filter(item => item.operation.status === SyncStatus.FAILED);

    for (const item of failedItems) {
      item.operation.status = SyncStatus.PENDING;
      item.operation.retryCount = 0;
      item.operation.error = undefined;
      await this.storage.addToSyncQueue(item.operation);
    }

    if (this.isOnline) {
      this.processSyncQueue()
    }
  }
}