import { Component, OnInit, OnDestroy, ElementRef, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { Observable, Subject, combineLatest, BehaviorSubject, interval } from 'rxjs';
import { map, takeUntil, debounceTime, filter, take, switchMap } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
// Icon removed - use primeicons in template
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChipModule } from 'primeng/chip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import {
  KitchenOrder,
  KitchenStation,
  OrderPriority,
  OrderStatus,
  KitchenStats,
  TimerState,
  VoiceCommand,
  BarcodeScanResult,
  KitchenNotification
} from '../../types';
import { KitchenOrderCardComponent } from '../order-card/kitchen-order-card.component';
import {
  OfflineStorageService,
  OfflineSyncService,
  VoiceRecognitionService,
  BarcodeScannerService,
  TimerService,
  PushNotificationService
} from '../../services';

interface DashboardFilters {
  station: KitchenStation | 'all';
  priority: OrderPriority | 'all';
  status: OrderStatus | 'all';
  searchTerm: string;
}

@Component({
  selector: 'app-kitchen-mobile-dashboard',
  templateUrl: './kitchen-mobile-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    ProgressBarModule,
    ChipModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    BadgeModule,
    SelectButtonModule,
    TooltipModule,
    KitchenOrderCardComponent
  ]
})
export class KitchenMobileDashboardComponent implements OnInit, OnDestroy {
  readonly barcodeVideoElement = viewChild.required<ElementRef<HTMLVideoElement>>('barcodeVideo');

  private destroy$ = new Subject<void>();

  // Data streams
  orders$!: Observable<KitchenOrder[]>;
  filteredOrders$!: Observable<KitchenOrder[]>;
  kitchenStats$!: Observable<KitchenStats>;
  timers$!: Observable<Map<string, TimerState>>;
  notifications$!: Observable<KitchenNotification[]>;
  syncState$!: Observable<any>;

  // UI state
  isHandset$!: Observable<boolean>;
  isTablet$!: Observable<boolean>;
  filters$ = new BehaviorSubject<DashboardFilters>({
    station: 'all',
    priority: 'all',
    status: 'active' as any,
    searchTerm: '',
  });

  // Feature states
  isVoiceListening$!: Observable<boolean>;
  isBarcodeScanning$!: Observable<boolean>;
  isOffline$!: Observable<boolean>;

  // Enum exports for template
  KitchenStation = KitchenStation;
  OrderPriority = OrderPriority;
  OrderStatus = OrderStatus;

  // Configuration
  readonly maxOrdersPerView = 20;
  readonly refreshInterval = 30000; // 30 seconds

  // UI state
  fabExpanded = false;
  torchEnabled = false;
  Object = Object;

  // Select button options
  stationOptions = [
    { label: 'All', value: 'all' },
    { label: 'Grill', value: KitchenStation.GRILL },
    { label: 'Fryer', value: KitchenStation.FRYER },
    { label: 'Salad', value: KitchenStation.SALAD },
    { label: 'Dessert', value: KitchenStation.DESSERT },
    { label: 'Drinks', value: KitchenStation.DRINKS },
    { label: 'Expedite', value: KitchenStation.EXPEDITE }
  ];
  selectedStation: KitchenStation | 'all' = 'all';

  constructor(
    private storage: OfflineStorageService,
    public syncService: OfflineSyncService,
    public voiceService: VoiceRecognitionService,
    public barcodeService: BarcodeScannerService,
    public timerService: TimerService,
    public notificationService: PushNotificationService,
    private breakpointObserver: BreakpointObserver,
    private messageService: MessageService
  ) {
    this.initializeStreams();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupVoiceCommands();
    this.setupNotifications();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAllServices();
  }

  private initializeStreams(): void {
    // Responsive breakpoints
    this.isHandset$ = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.HandsetPortrait
    ]).pipe(map(result => result.matches));

    this.isTablet$ = this.breakpointObserver.observe([
      Breakpoints.Tablet,
      Breakpoints.TabletPortrait
    ]).pipe(map(result => result.matches));

    // Data streams
    this.orders$ = this.storage.isReady$.pipe(
      filter(ready => ready),
      switchMap(() => this.loadOrders())
    );

    this.filteredOrders$ = combineLatest([
      this.orders$,
      this.filters$
    ]).pipe(
      map(([orders, filters]) => this.applyFilters(orders, filters)),
      map(orders => orders.slice(0, this.maxOrdersPerView))
    );

    this.timers$ = this.timerService.timers;
    this.notifications$ = this.notificationService.notifications;
    this.syncState$ = this.syncService.state$;

    // Service states
    this.isVoiceListening$ = this.voiceService.isListening;
    this.isBarcodeScanning$ = this.barcodeService.isScanning;
    this.isOffline$ = this.syncState$.pipe(map(state => !state.isOnline));

    // Kitchen stats (computed from orders)
    this.kitchenStats$ = this.orders$.pipe(
      map(orders => this.calculateKitchenStats(orders))
    );
  }

  private async loadInitialData(): Promise<void> {
    try {
      // Load orders from storage
      await this.storage.isReady$.pipe(
        filter(ready => ready),
        take(1)
      ).toPromise();

      // Force sync if online
      if (this.syncService.isOnline) {
        await this.syncService.forcePullFromServer();
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.showErrorMessage('Failed to load kitchen data');
    }
  }

  private loadOrders(): Observable<KitchenOrder[]> {
    return new Observable(observer => {
      this.storage.getOrders().then(orders => {
        // Filter for active orders only
        const activeOrders = orders.filter(order =>
          order.status !== OrderStatus.DELIVERED &&
          order.status !== OrderStatus.CANCELLED
        );
        observer.next(activeOrders);
      }).catch(error => {
        console.error('Failed to load orders:', error);
        observer.next([]);
      });
    });
  }

  private applyFilters(orders: KitchenOrder[], filters: DashboardFilters): KitchenOrder[] {
    return orders.filter(order => {
      // Station filter
      if (filters.station !== 'all' && order.station !== filters.station) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && order.priority !== filters.priority) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          order.id.toLowerCase().includes(searchLower) ||
          order.items?.some(item =>
            item.name?.toLowerCase().includes(searchLower)
          ) ||
          order.notes?.some(note =>
            note.toLowerCase().includes(searchLower)
          )
        );
      }

      return true;
    });
  }

  private calculateKitchenStats(orders: KitchenOrder[]): KitchenStats {
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
        [KitchenStation.EXPEDITE]: 0,
      }
    }

    orders.forEach(order => {
      if (order.status === OrderStatus.DELIVERED) {
        stats.ordersCompleted++;
      } else {
        stats.ordersInProgress++;
        stats.stationWorkload[order.station]++;

        // Calculate current wait time
        const waitTime = Date.now() - new Date(order.createdAt).getTime();
        stats.currentWaitTime = Math.max(stats.currentWaitTime, waitTime);
      }
    });

    return stats;
  }

  private setupVoiceCommands(): void {
    this.voiceService.commands
      .pipe(takeUntil(this.destroy$))
      .subscribe(command => this.handleVoiceCommand(command));
  }

  private setupNotifications(): void {
    // Request notification permission
    this.notificationService.requestPermission().catch(error => {
      console.warn('Notification permission denied:', error);
    });

    // Handle notification actions
    this.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        // Auto-dismiss old notifications
        const now = Date.now();
        notifications.forEach(notification => {
          if (!notification.persistent &&
              now - notification.timestamp.getTime() > 30000) {
            this.notificationService.dismissNotification(notification.id);
          }
        });
      });
  }

  private setupAutoRefresh(): void {
    // Auto-refresh orders when online
    interval(this.refreshInterval)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.syncService.isOnline),
      )
      .subscribe(() => {
        this.syncService.processSyncQueue();
      });
  }

  // Voice command handlers
  private async handleVoiceCommand(command: VoiceCommand): Promise<void> {
    try {
      switch (command.command) {
        case 'start_timer':
          await this.handleStartTimerCommand(command);
          break;
        case 'stop_timer':
          await this.handleStopTimerCommand(command);
          break;
        case 'complete_order':
          await this.handleCompleteOrderCommand(command);
          break;
        case 'mark_ready':
          await this.handleMarkReadyCommand(command);
          break;
        case 'filter_station':
          this.handleFilterStationCommand(command);
          break;
        case 'show_orders':
          this.handleShowOrdersCommand();
          break;
        case 'scan_barcode':
          await this.startBarcodeScanning();
          break;
        default:
          console.log('Unknown voice command:', command);
      }

      this.showSuccessMessage(`Voice command executed: ${command.command}`);
    } catch (error) {
      console.error('Voice command failed:', error);
      this.showErrorMessage('Voice command failed');
    }
  }

  private async handleStartTimerCommand(command: VoiceCommand): Promise<void> {
    const orderId = command.parameters?.['orderId'];
    if (orderId) {
      await this.startTimerForOrder(orderId);
    } else {
      // Start timer for currently selected/first order
      const orders = await this.filteredOrders$.pipe(take(1)).toPromise();
      if (orders && orders.length > 0) {
        await this.startTimerForOrder(orders[0].id);
      }
    }
  }

  private async handleStopTimerCommand(command: VoiceCommand): Promise<void> {
    const orderId = command.parameters?.['orderId'];
    if (orderId) {
      await this.timerService.stopTimer(orderId);
    } else {
      // Stop all active timers
      await this.timerService.stopAllTimers();
    }
  }

  private async handleCompleteOrderCommand(command: VoiceCommand): Promise<void> {
    const orderId = command.parameters?.['orderId'];
    if (orderId) {
      await this.completeOrder(orderId);
    }
  }

  private async handleMarkReadyCommand(command: VoiceCommand): Promise<void> {
    const orderId = command.parameters?.['orderId'];
    if (orderId) {
      await this.markOrderReady(orderId);
    }
  }

  private handleFilterStationCommand(command: VoiceCommand): void {
    const station = command.parameters?.['station'] as KitchenStation;
    if (station) {
      this.updateFilter({ station });
    }
  }

  private handleShowOrdersCommand(): void {
    // Reset filters to show all orders
    this.updateFilter({
      station: 'all',
      priority: 'all',
      status: 'all' as any,
      searchTerm: '',
    });
  }

  // Order management methods
  async startTimerForOrder(orderId: string): Promise<void> {
    const orders = await this.orders$.pipe(take(1)).toPromise();
    const order = orders?.find(o => o.id === orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    const duration = order.estimatedPrepTime * 60 * 1000; // Convert minutes to ms
    await this.timerService.startTimer(orderId, duration);

    this.notificationService.showNotification({
      type: 'system_message' as any,
      title: 'Timer Started',
      message: `Timer started for order #${orderId}`,
      priority: 'normal' as any,
      persistent: false,
      soundEnabled: false,
      vibrationEnabled: false,
    });
  }

  async completeOrder(orderId: string): Promise<void> {
    const order = await this.getOrderById(orderId);
    if (!order) return;

    order.status = OrderStatus.DELIVERED;
    await this.storage.saveOrder(order);

    // Stop timer if running
    await this.timerService.stopTimer(orderId);

    // Queue sync operation
    await this.syncService.queueOperation({
      id: `order_complete_${orderId}_${Date.now()}`,
      type: 'order_status_change' as any,
      data: { orderId, status: OrderStatus.DELIVERED, timestamp: new Date() },
      timestamp: new Date(),
      status: 'pending' as any,
      retryCount: 0,
    });

    this.notificationService.showNotification({
      type: 'success' as any,
      title: 'Order Completed',
      message: `Order #${orderId} marked as completed`,
      priority: 'normal' as any,
      persistent: false,
      soundEnabled: true,
      vibrationEnabled: false,
    });
  }

  async markOrderReady(orderId: string): Promise<void> {
    const order = await this.getOrderById(orderId);
    if (!order) return;

    order.status = OrderStatus.READY as any;
    await this.storage.saveOrder(order);

    await this.syncService.queueOperation({
      id: `order_ready_${orderId}_${Date.now()}`,
      type: 'order_status_change' as any,
      data: { orderId, status: 'ready', timestamp: new Date() },
      timestamp: new Date(),
      status: 'pending' as any,
      retryCount: 0,
    });
  }

  private async getOrderById(orderId: string): Promise<KitchenOrder | undefined> {
    const orders = await this.orders$.pipe(take(1)).toPromise();
    return orders?.find(o => o.id === orderId);
  }

  // Barcode scanning
  async startBarcodeScanning(): Promise<void> {
    const barcodeVideoElement = this.barcodeVideoElement();
    if (!barcodeVideoElement) {
      this.showErrorMessage('Video element not available');
      return;
    }

    try {
      await this.barcodeService.startScanning(barcodeVideoElement.nativeElement);

      this.barcodeService.scans
        .pipe(
          takeUntil(this.destroy$),
          debounceTime(1000),
        )
        .subscribe(result => this.handleBarcodeScan(result));

    } catch (error) {
      console.error('Failed to start barcode scanning:', error);
      this.showErrorMessage('Failed to start barcode scanning');
    }
  }

  stopBarcodeScanning(): void {
    this.barcodeService.stopScanning();
  }

  private async handleBarcodeScan(result: BarcodeScanResult): Promise<void> {
    try {
      // Look up inventory item by barcode
      const inventoryItem = await this.storage.getInventoryByBarcode(result.text);

      if (inventoryItem) {
        this.showSuccessMessage(`Scanned: ${inventoryItem.name}`);
        // Handle inventory update logic here
      } else {
        this.showErrorMessage(`Unknown barcode: ${result.text}`);
      }
    } catch (error) {
      console.error('Failed to handle barcode scan:', error);
      this.showErrorMessage('Failed to process barcode');
    }
  }

  // Voice control
  toggleVoiceListening(): void {
    this.voiceService.toggleListening();
  }

  // Filter management
  updateFilter(updates: Partial<DashboardFilters>): void {
    const currentFilters = this.filters$.value;
    this.filters$.next({ ...currentFilters, ...updates });
  }

  clearFilters(): void {
    this.filters$.next({
      station: 'all',
      priority: 'all',
      status: 'active' as any,
      searchTerm: '',
    });
  }

  // Utility methods
  private stopAllServices(): void {
    this.voiceService.stopListening();
    this.barcodeService.stopScanning();
  }

  private showSuccessMessage(message: string): void {
    // Show success message via notification service
    this.notificationService.showNotification({
      type: 'success' as any,
      title: 'Success',
      message,
      priority: 'normal' as any,
      persistent: false,
      soundEnabled: false,
      vibrationEnabled: false,
    });
  }

  private showErrorMessage(message: string): void {
    // Show error message via notification service
    this.notificationService.showNotification({
      type: 'error' as any,
      title: 'Error',
      message,
      priority: 'high' as any,
      persistent: true,
      soundEnabled: true,
      vibrationEnabled: false,
    });
  }

  // Template helper methods
  getOrdersByStation(station: KitchenStation): Observable<KitchenOrder[]> {
    return this.filteredOrders$.pipe(
      map(orders => orders.filter(order => order.station === station)),
    );
  }

  getTimerForOrder(orderId: string): Observable<TimerState | undefined> {
    return this.timerService.getTimer(orderId);
  }

  formatTimeRemaining(timeMs: number): string {
    return this.timerService.formatTime(timeMs);
  }

  getOrderPriorityClass(priority: OrderPriority): string {
    const classMap = {
      [OrderPriority.LOW]: 'priority-low',
      [OrderPriority.NORMAL]: 'priority-normal',
      [OrderPriority.HIGH]: 'priority-high',
      [OrderPriority.URGENT]: 'priority-urgent'
    };
    return classMap[priority] || 'priority-normal';
  }

  trackByOrderId(index: number, order: KitchenOrder): string {
    return order.id;
  }

  trackByNotificationId(index: number, notification: KitchenNotification): string {
    return notification.id;
  }

  // Template helper methods for missing functions
  getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'info': 'pi-info-circle',
      'warning': 'pi-exclamation-triangle',
      'error': 'pi-times-circle',
      'success': 'pi-check-circle',
      'default': 'pi-bell'
    };
    return iconMap[type] || iconMap['default'];
  }

  getStationIcon(station: KitchenStation): string {
    const iconMap = {
      [KitchenStation.GRILL]: 'pi-fire',
      [KitchenStation.FRYER]: 'pi-bolt',
      [KitchenStation.SALAD]: 'pi-globe',
      [KitchenStation.DESSERT]: 'pi-star',
      [KitchenStation.DRINKS]: 'pi-shopping-cart',
      [KitchenStation.EXPEDITE]: 'pi-send'
    };
    return iconMap[station] || 'pi-home';
  }
}