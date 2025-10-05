import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, interval } from 'rxjs';
import { map, filter, switchMap, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import {
  KitchenOrder,
  KitchenStats,
  KitchenConfig,
  InventoryItem,
  KitchenStation,
  OrderPriority
} from '../types';
import { OrderStatus } from '@app/models/enums';
import { OfflineStorageService } from './storage/offline-storage.service';
import { OfflineSyncService } from './sync/offline-sync.service';

@Injectable({
  providedIn: 'root',
})
export class KitchenDataService {
  private readonly API_BASE_URL = '/api/kitchen';

  private orders$ = new BehaviorSubject<KitchenOrder[]>([]);
  private inventory$ = new BehaviorSubject<InventoryItem[]>([]);
  private config$ = new BehaviorSubject<KitchenConfig>({
    stationEnabled: {
      [KitchenStation.GRILL]: true,
      [KitchenStation.FRYER]: true,
      [KitchenStation.SALAD]: true,
      [KitchenStation.DESSERT]: true,
      [KitchenStation.DRINKS]: true,
      [KitchenStation.EXPEDITE]: true
    },
    voiceControlEnabled: true,
    barcodeScannerEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    autoTimerStart: false,
    maxOrdersPerView: 20,
    refreshInterval: 30000
  });

  constructor(
    private http: HttpClient,
    private storage: OfflineStorageService,
    private syncService: OfflineSyncService
  ) {
    this.initializeData();
  }

  get orders(): Observable<KitchenOrder[]> {
    return this.orders$.asObservable()
  }

  get inventory(): Observable<InventoryItem[]> {
    return this.inventory$.asObservable()
  }

  get config(): Observable<KitchenConfig> {
    return this.config$.asObservable()
  }

  get stats(): Observable<KitchenStats> {
    return this.orders$.pipe(
      map(orders => this.calculateStats(orders))
    );
  }

  private async initializeData(): Promise<void> {
    // Wait for storage to be ready
    await this.storage.isReady$.pipe(
      filter(ready => ready)
    ).toPromise();

    // Load data from storage
    await this.loadFromStorage();

    // Setup auto-refresh
    this.setupAutoRefresh();

    // Try to sync from server if online
    if (this.syncService.isOnline) {
      this.syncFromServer().catch(error => {
        console.warn('Initial sync failed:', error);
      });
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      // Load orders
      const orders = await this.storage.getOrders();
      this.orders$.next(orders);

      // Load inventory
      const inventory = await this.storage.getInventory();
      this.inventory$.next(inventory);

      // Load config
      const config = await this.storage.getConfig('kitchen_config');
      if (config) {
        this.config$.next({ ...this.config$.value, ...config });
      }
    } catch (error) {
      console.error('Failed to load data from storage:', error);
    }
  }

  private setupAutoRefresh(): void {
    const config = this.config$.value;

    interval(config.refreshInterval).pipe(
      filter(() => this.syncService.isOnline),
      switchMap(() => this.syncFromServer())
    ).subscribe();
  }

  private async syncFromServer(): Promise<void> {
    try {
      await this.syncService.forcePullFromServer();
      await this.loadFromStorage();
    } catch (error) {
      console.error('Sync from server failed:', error);
      throw error;
    }
  }

  private calculateStats(orders: KitchenOrder[]): KitchenStats {
    const stats: KitchenStats = {
      ordersCompleted: 0,
      averagePrepTime: 0,
      currentWaitTime: 0,
      ordersInProgress: 0,
      stationWorkload: {
        [KitchenStation.GRILL]: 0,
        [KitchenStation.FRYER]: 0,
        [KitchenStation.SALAD]: 0,
        [KitchenStation.DESSERT]: 0,
        [KitchenStation.DRINKS]: 0,
        [KitchenStation.EXPEDITE]: 0
      }
    };

    let totalPrepTime = 0;
    let completedOrdersCount = 0;
    let maxWaitTime = 0;

    orders.forEach(order => {
      if (order.status === OrderStatus.DELIVERED) {
        stats.ordersCompleted++;
        completedOrdersCount++;

        // Calculate prep time if available
        if (order.completedAt && order.createdAt) {
          const prepTime = new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime();
          totalPrepTime += prepTime;
        }
      } else if (order.status !== OrderStatus.CANCELLED) {
        stats.ordersInProgress++;
        stats.stationWorkload[order.station]++;

        // Calculate current wait time
        const waitTime = Date.now() - new Date(order.createdAt).getTime();
        maxWaitTime = Math.max(maxWaitTime, waitTime);
      }
    });

    stats.averagePrepTime = completedOrdersCount > 0 ? totalPrepTime / completedOrdersCount : 0;
    stats.currentWaitTime = maxWaitTime;

    return stats;
  }

  // Order management methods
  async createOrder(orderData: Partial<KitchenOrder>): Promise<KitchenOrder> {
    const order = {
      id: this.generateOrderId(),
      createdAt: new Date(),
      status: OrderStatus.PENDING,
      priority: OrderPriority.NORMAL,
      station: KitchenStation.EXPEDITE,
      estimatedPrepTime: 15,
      items: [],
      notes: [],
      allergens: [],
      ...orderData
    } as KitchenOrder;

    // Save to storage
    await this.storage.saveOrder(order);

    // Update local state
    const currentOrders = this.orders$.value;
    this.orders$.next([...currentOrders, order]);

    // Queue for sync
    await this.syncService.queueOperation({
      id: `order_create_${order.id}_${Date.now()}`,
      type: 'order_update' as any,
      data: order,
      timestamp: new Date(),
      status: 'pending' as any,
      retryCount: 0
    });

    return order;
  }

  async updateOrder(orderId: string, updates: Partial<KitchenOrder>): Promise<void> {
    const currentOrders = this.orders$.value;
    const orderIndex = currentOrders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      throw new Error('Order not found');
    }

    const updatedOrder = { ...currentOrders[orderIndex], ...updates };

    // Save to storage
    await this.storage.saveOrder(updatedOrder);

    // Update local state
    const newOrders = [...currentOrders];
    newOrders[orderIndex] = updatedOrder;
    this.orders$.next(newOrders);

    // Queue for sync
    await this.syncService.queueOperation({
      id: `order_update_${orderId}_${Date.now()}`,
      type: 'order_update' as any,
      data: updatedOrder,
      timestamp: new Date(),
      status: 'pending' as any,
      retryCount: 0
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const updates: Partial<KitchenOrder> = { status };

    if (status === OrderStatus.DELIVERED) {
      updates.completedAt = new Date();
    }

    await this.updateOrder(orderId, updates);
  }

  async deleteOrder(orderId: string): Promise<void> {
    await this.storage.deleteOrder(orderId);

    const currentOrders = this.orders$.value;
    const filteredOrders = currentOrders.filter(o => o.id !== orderId);
    this.orders$.next(filteredOrders);
  }

  // Inventory management methods
  async updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): Promise<void> {
    const currentInventory = this.inventory$.value;
    const itemIndex = currentInventory.findIndex(i => i.id === itemId);

    if (itemIndex === -1) {
      throw new Error('Inventory item not found');
    }

    const updatedItem = { ...currentInventory[itemIndex], ...updates, lastUpdated: new Date() };

    // Save to storage
    await this.storage.saveInventoryItem(updatedItem);

    // Update local state
    const newInventory = [...currentInventory];
    newInventory[itemIndex] = updatedItem;
    this.inventory$.next(newInventory);

    // Queue for sync
    await this.syncService.queueOperation({
      id: `inventory_update_${itemId}_${Date.now()}`,
      type: 'inventory_update' as any,
      data: updatedItem,
      timestamp: new Date(),
      status: 'pending' as any,
      retryCount: 0
    });
  }

  async updateInventoryStock(itemId: string, newStock: number): Promise<void> {
    await this.updateInventoryItem(itemId, { currentStock: newStock });
  }

  async getInventoryByBarcode(barcode: string): Promise<InventoryItem | undefined> {
    return await this.storage.getInventoryByBarcode(barcode);
  }

  async getLowStockItems(threshold?: number): Promise<InventoryItem[]> {
    const defaultThreshold = 10;
    return await this.storage.getLowStockItems(threshold || defaultThreshold);
  }

  // Configuration methods
  async updateConfig(updates: Partial<KitchenConfig>): Promise<void> {
    const newConfig = { ...this.config$.value, ...updates };
    this.config$.next(newConfig);

    // Save to storage
    await this.storage.saveConfig('kitchen_config', newConfig);

    // Queue for sync
    await this.syncService.queueOperation({
      id: `config_update_${Date.now()}`,
      type: 'configuration_update' as any,
      data: newConfig,
      timestamp: new Date(),
      status: 'pending' as any,
      retryCount: 0
    });
  }

  // Query methods
  getOrdersByStation(station: KitchenStation): Observable<KitchenOrder[]> {
    return this.orders$.pipe(
      map(orders => orders.filter(order => order.station === station))
    );
  }

  getOrdersByStatus(status: OrderStatus): Observable<KitchenOrder[]> {
    return this.orders$.pipe(
      map(orders => orders.filter(order => order.status === status))
    );
  }

  getOrdersByPriority(priority: OrderPriority): Observable<KitchenOrder[]> {
    return this.orders$.pipe(
      map(orders => orders.filter(order => order.priority === priority))
    );
  }

  getUrgentOrders(): Observable<KitchenOrder[]> {
    return this.orders$.pipe(
      map(orders => orders.filter(order =>
        order.priority === OrderPriority.URGENT ||
        (order.status === OrderStatus.PREPARING && this.isOrderOverdue(order))
      ))
    );
  }

  getActiveOrders(): Observable<KitchenOrder[]> {
    return this.orders$.pipe(
      map(orders => orders.filter(order =>
        order.status !== OrderStatus.DELIVERED &&
        order.status !== OrderStatus.CANCELLED
      ))
    );
  }

  // Utility methods
  private generateOrderId(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private isOrderOverdue(order: KitchenOrder): boolean {
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    const overdueThreshold = order.estimatedPrepTime * 60 * 1000 * 1.5; // 150% of estimated time
    return orderAge > overdueThreshold;
  }

  // Search and filter methods
  searchOrders(query: string): Observable<KitchenOrder[]> {
    const searchTerm = query.toLowerCase().trim();

    return this.orders$.pipe(
      map(orders => {
        if (!searchTerm) return orders;

        return orders.filter(order =>
          order.id.toLowerCase().includes(searchTerm) ||
          order.items?.some(item =>
            item.name?.toLowerCase().includes(searchTerm)
          ) ||
          order.notes?.some(note =>
            note.toLowerCase().includes(searchTerm)
          )
        );
      })
    );
  }

  // Batch operations
  async batchUpdateOrderStatus(orderIds: string[], status: OrderStatus): Promise<void> {
    const updates = orderIds.map(id => ({ id, status }));

    for (const update of updates) {
      await this.updateOrderStatus(update.id, update.status);
    }
  }

  async batchDeleteOrders(orderIds: string[]): Promise<void> {
    for (const orderId of orderIds) {
      await this.deleteOrder(orderId);
    }
  }

  // Real-time data refresh
  async refreshData(): Promise<void> {
    try {
      if (this.syncService.isOnline) {
        await this.syncFromServer();
      } else {
        await this.loadFromStorage();
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
      throw error;
    }
  }

  // Export/Import functionality
  async exportData(): Promise<{
    orders: KitchenOrder[];
    inventory: InventoryItem[];
    config: KitchenConfig;
    exportDate: Date;
  }> {
    return {
      orders: this.orders$.value,
      inventory: this.inventory$.value,
      config: this.config$.value,
      exportDate: new Date()
    };
  }

  async importData(data: {
    orders?: KitchenOrder[];
    inventory?: InventoryItem[];
    config?: KitchenConfig;
  }): Promise<void> {
    if (data.orders) {
      await this.storage.saveOrders(data.orders);
      this.orders$.next(data.orders);
    }

    if (data.inventory) {
      for (const item of data.inventory) {
        await this.storage.saveInventoryItem(item);
      }
      this.inventory$.next(data.inventory);
    }

    if (data.config) {
      await this.storage.saveConfig('kitchen_config', data.config);
      this.config$.next(data.config);
    }
  }
}