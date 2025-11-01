import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Observable, BehaviorSubject, from } from 'rxjs';
import {
  KitchenOrder,
  InventoryItem,
  SyncOperation,
  OfflineQueueItem,
  KitchenConfig,
  TimerState
} from '../../types';

interface KitchenMobileDB extends DBSchema {
  orders: {
    key: string;
    value: KitchenOrder;
    indexes: {
      'by-status': string;
      'by-station': string;
      'by-priority': string;
      'by-timestamp': Date;
    }
  }
  inventory: {
    key: string;
    value: InventoryItem;
    indexes: {
      'by-barcode': string;
      'by-low-stock': number;
    }
  }
  sync_queue: {
    key: string;
    value: OfflineQueueItem;
    indexes: {
      'by-priority': number;
      'by-created': Date;
    }
  }
  timers: {
    key: string;
    value: TimerState;
    indexes: { 'by-order': string; }
  }
  config: {
    key: string;
    value: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class OfflineStorageService {
  private db: IDBPDatabase<KitchenMobileDB> | null = null;
  private dbReady$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initDatabase()
  }

  private async initDatabase(): Promise<void> {
    try {
      this.db = await openDB<KitchenMobileDB>('kitchen-mobile-db', 1, {
        upgrade(db: IDBPDatabase<KitchenMobileDB>) {
          // Orders store
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
          ordersStore.createIndex('by-status', 'status');
          ordersStore.createIndex('by-station', 'station');
          ordersStore.createIndex('by-priority', 'priority');
          ordersStore.createIndex('by-timestamp', 'createdAt');

          // Inventory store
          const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
          inventoryStore.createIndex('by-barcode', 'barcode');
          inventoryStore.createIndex('by-low-stock', 'currentStock');

          // Sync queue store
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('by-priority', 'priority');
          syncStore.createIndex('by-created', 'createdAt');

          // Timers store
          const timersStore = db.createObjectStore('timers', { keyPath: 'orderId' });
          timersStore.createIndex('by-order', 'orderId');

          // Config store
          db.createObjectStore('config', { keyPath: 'key' });
        }
      });

      this.dbReady$.next(true);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.dbReady$.next(false);
    }
  }

  get isReady$(): Observable<boolean> {
    return this.dbReady$.asObservable()
  }

  // Orders operations
  async getOrders(): Promise<KitchenOrder[]> {
    if (!this.db) return []
    return await this.db.getAll('orders');
  }

  async getOrdersByStatus(status: string): Promise<KitchenOrder[]> {
    if (!this.db) return []
    return await this.db.getAllFromIndex('orders', 'by-status', status);
  }

  async getOrdersByStation(station: string): Promise<KitchenOrder[]> {
    if (!this.db) return []
    return await this.db.getAllFromIndex('orders', 'by-station', station);
  }

  async saveOrder(order: KitchenOrder): Promise<void> {
    if (!this.db) return;
    await this.db.put('orders', order);
  }

  async saveOrders(orders: KitchenOrder[]): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction('orders', 'readwrite');
    await Promise.all([
      ...orders.map(order => tx.store.put(order)),
      tx.done
    ]);
  }

  async deleteOrder(orderId: string): Promise<void> {
    if (!this.db) return;
    await this.db.delete('orders', orderId);
  }

  // Inventory operations
  async getInventory(): Promise<InventoryItem[]> {
    if (!this.db) return []
    return await this.db.getAll('inventory');
  }

  async getInventoryByBarcode(barcode: string): Promise<InventoryItem | undefined> {
    if (!this.db) return undefined;
    return await this.db.getFromIndex('inventory', 'by-barcode', barcode);
  }

  async getLowStockItems(threshold: number): Promise<InventoryItem[]> {
    if (!this.db) return []
    const tx = this.db.transaction('inventory', 'readonly');
    const items: InventoryItem[] = []

    for await (const cursor of tx.store.index('by-low-stock').iterate()) {
      if (cursor.value.currentStock <= threshold) {
        items.push(cursor.value);
      }
    }

    return items;
  }

  async saveInventoryItem(item: InventoryItem): Promise<void> {
    if (!this.db) return;
    await this.db.put('inventory', item);
  }

  async updateInventoryStock(itemId: string, newStock: number): Promise<void> {
    if (!this.db) return;
    const item = await this.db.get('inventory', itemId);
    if (item) {
      item.currentStock = newStock;
      item.lastUpdated = new Date()
      await this.db.put('inventory', item);
    }
  }

  // Sync queue operations
  async addToSyncQueue(operation: SyncOperation): Promise<void> {
    if (!this.db) return;

    const queueItem: OfflineQueueItem = {
      id: operation.id,
      operation,
      priority: this.getSyncPriority(operation.type),
      createdAt: new Date()
    };

    await this.db.put('sync_queue', queueItem);
  }

  async getSyncQueue(): Promise<OfflineQueueItem[]> {
    if (!this.db) return []
    return await this.db.getAllFromIndex('sync_queue', 'by-priority');
  }

  async removeFromSyncQueue(operationId: string): Promise<void> {
    if (!this.db) return;
    await this.db.delete('sync_queue', operationId);
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) return;
    await this.db.clear('sync_queue');
  }

  // Timer operations
  async saveTimer(timer: TimerState): Promise<void> {
    if (!this.db) return;
    await this.db.put('timers', timer);
  }

  async getTimer(orderId: string): Promise<TimerState | undefined> {
    if (!this.db) return undefined;
    return await this.db.get('timers', orderId);
  }

  async getAllTimers(): Promise<TimerState[]> {
    if (!this.db) return []
    return await this.db.getAll('timers');
  }

  async deleteTimer(orderId: string): Promise<void> {
    if (!this.db) return;
    await this.db.delete('timers', orderId);
  }

  // Configuration operations
  async saveConfig(key: string, value: any): Promise<void> {
    if (!this.db) return;
    await this.db.put('config', { key, value });
  }

  async getConfig(key: string): Promise<any> {
    if (!this.db) return null;
    const result = await this.db.get('config', key);
    return result?.value;
  }

  // Storage management
  async getStorageUsage(): Promise<{ used: number; available: number }> {
    if (!navigator.storage?.estimate) {
      return { used: 0, available: 0 }
    }

    const estimate = await navigator.storage.estimate()
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;

    const stores: ('orders' | 'inventory' | 'sync_queue' | 'timers' | 'config')[] = ['orders', 'inventory', 'sync_queue', 'timers', 'config']
    const tx = this.db.transaction(stores, 'readwrite');

    await Promise.all([
      ...stores.map(store => tx.objectStore(store).clear()),
      tx.done
    ]);
  }

  private getSyncPriority(operationType: string): number {
    const priorityMap: Record<string, number> = {
      'order_status_change': 1,
      'timer_start': 2,
      'timer_stop': 2,
      'order_update': 3,
      'inventory_update': 4,
      'configuration_update': 5,
      'kitchen_stats': 6
    };

    return priorityMap[operationType] || 5;
  }
}