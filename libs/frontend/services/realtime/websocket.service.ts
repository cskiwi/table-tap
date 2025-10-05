import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject, fromEvent, timer } from 'rxjs';
import { filter, map, takeUntil, retry, retryWhen, delay, tap } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';

import {
  WebSocketMessage,
  OrderUpdate,
  InventoryAlert,
  NotificationMessage,
  ServiceConfig
} from '../core/types';

export interface ConnectionConfig {
  url: string;
  options?: {
    transports?: string[]
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionDelay?: number;
    reconnectionAttempts?: number;
    timeout?: number;
  }
}

export interface SocketEvent {
  event: string;
  data: any;
  timestamp: Date;
}

/**
 * WebSocket service for real-time communication with the backend
 * Handles connection management, reconnection, and message routing
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private destroy$ = new Subject<void>()

  // Connection state
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  private connectionErrorSubject = new BehaviorSubject<string | null>(null);
  private reconnectAttemptsSubject = new BehaviorSubject<number>(0);

  // Message streams
  private messageSubject = new Subject<WebSocketMessage>()
  private orderUpdateSubject = new Subject<OrderUpdate>()
  private inventoryAlertSubject = new Subject<InventoryAlert>()
  private notificationSubject = new Subject<NotificationMessage>()

  // Observables
  public readonly isConnected$ = this.isConnectedSubject.asObservable()
  public readonly connectionError$ = this.connectionErrorSubject.asObservable()
  public readonly reconnectAttempts$ = this.reconnectAttemptsSubject.asObservable()

  public readonly messages$ = this.messageSubject.asObservable()
  public readonly orderUpdates$ = this.orderUpdateSubject.asObservable()
  public readonly inventoryAlerts$ = this.inventoryAlertSubject.asObservable()
  public readonly notifications$ = this.notificationSubject.asObservable()

  // Configuration
  private config: ConnectionConfig = {
    url: '/socket.io',
    options: {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    }
  }

  // User context
  private userId: string | null = null;
  private cafeId: string | null = null;
  private userRole: string | null = null;

  constructor() {
    // Auto-reconnect logic
    this.isConnected$.pipe(
      filter(connected => !connected),
      retryWhen(errors => errors.pipe(
        tap((error) => {
          console.error('WebSocket connection error:', error);
          this.connectionErrorSubject.next(error.message || 'Connection failed');
        }),
        delay(this.config.options?.reconnectionDelay || 1000)
      )),
      takeUntil(this.destroy$)
    ).subscribe()
  }

  /**
   * Connect to WebSocket server
   */
  connect(config?: Partial<ConnectionConfig>, userContext?: {
    userId: string;
    cafeId: string;
    userRole: string;
  }): Observable<boolean> {
    if (this.socket && this.socket.connected) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete()
      });
    }

    // Update configuration
    if (config) {
      this.config = { ...this.config, ...config }
    }

    // Store user context
    if (userContext) {
      this.userId = userContext.userId;
      this.cafeId = userContext.cafeId;
      this.userRole = userContext.userRole;
    }

    // Create socket connection
    this.socket = io(this.config.url, this.config.options);

    this.setupEventListeners()

    return new Observable(observer => {
      const onConnect = () => {
        this.isConnectedSubject.next(true);
        this.connectionErrorSubject.next(null);
        this.reconnectAttemptsSubject.next(0);

        // Join user-specific rooms
        if (this.userId && this.cafeId) {
          this.joinRooms()
        }

        observer.next(true);
        observer.complete()
      }

      const onError = (error: any) => {
        this.isConnectedSubject.next(false);
        this.connectionErrorSubject.next(error.message || 'Connection failed');
        observer.error(error);
      }

      this.socket!.on('connect', onConnect);
      this.socket!.on('connect_error', onError);

      // Connect to server
      this.socket!.connect()

      // Cleanup on unsubscribe
      return () => {
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null;
      this.isConnectedSubject.next(false);
    }
  }

  /**
   * Send message to server
   */
  emit(event: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, {
        ...data,
        userId: this.userId,
        cafeId: this.cafeId,
        timestamp: new Date()
      });
    } else {
      console.warn('Socket not connected. Cannot send message:', event, data);
    }
  }

  /**
   * Subscribe to specific event
   */
  on<T = any>(event: string): Observable<T> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error(new Error('Socket not initialized'));
        return;
      }

      const handler = (data: T) => observer.next(data);
      this.socket.on(event, handler);

      // Cleanup on unsubscribe
      return () => {
        this.socket?.off(event, handler);
      }
    }).pipe(takeUntil(this.destroy$));
  }

  /**
   * Subscribe to order updates
   */
  subscribeToOrderUpdates(orderId?: string): Observable<OrderUpdate> {
    if (orderId) {
      return this.orderUpdates$.pipe(
        filter(update => update.payload.orderId === orderId)
      );
    }
    return this.orderUpdates$;
  }

  /**
   * Subscribe to inventory alerts
   */
  subscribeToInventoryAlerts(): Observable<InventoryAlert> {
    return this.inventoryAlerts$;
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(): Observable<NotificationMessage> {
    return this.notifications$;
  }

  /**
   * Join cafe-specific rooms
   */
  joinCafeRoom(cafeId: string): void {
    this.cafeId = cafeId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_cafe', { cafeId });
    }
  }

  /**
   * Leave cafe-specific rooms
   */
  leaveCafeRoom(cafeId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_cafe', { cafeId });
    }
  }

  /**
   * Join order-specific room
   */
  joinOrderRoom(orderId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_order', { orderId });
    }
  }

  /**
   * Leave order-specific room
   */
  leaveOrderRoom(orderId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_order', { orderId });
    }
  }

  /**
   * Join kitchen display room
   */
  joinKitchenRoom(): void {
    if (this.socket && this.socket.connected && this.cafeId) {
      this.socket.emit('join_kitchen', { cafeId: this.cafeId });
    }
  }

  /**
   * Send order status update
   */
  updateOrderStatus(orderId: string, status: string, estimatedTime?: number): void {
    this.emit('order_status_update', {
      orderId,
      status,
      estimatedTime,
      updatedBy: this.userId
    });
  }

  /**
   * Send inventory alert
   */
  sendInventoryAlert(itemId: string, itemName: string, currentStock: number, minimumStock: number): void {
    this.emit('inventory_alert', {
      itemId,
      itemName,
      currentStock,
      minimumStock,
      severity: currentStock === 0 ? 'CRITICAL' : 'LOW',
      cafeId: this.cafeId
    });
  }

  /**
   * Send notification
   */
  sendNotification(title: string, message: string, targetUserId?: string, severity: string = 'INFO'): void {
    this.emit('notification', {
      title,
      message,
      targetUserId,
      severity,
      cafeId: this.cafeId
    });
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    isConnected: boolean;
    connectionError: string | null;
    reconnectAttempts: number;
    socketId: string | null;
  } {
    return {
      isConnected: this.isConnectedSubject.value,
      connectionError: this.connectionErrorSubject.value,
      reconnectAttempts: this.reconnectAttemptsSubject.value,
      socketId: this.socket?.id || null
    }
  }

  /**
   * Setup event listeners for the socket
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnectedSubject.next(true);
      this.connectionErrorSubject.next(null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnectedSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnectedSubject.next(false);
      this.connectionErrorSubject.next(error.message);

      const currentAttempts = this.reconnectAttemptsSubject.value;
      this.reconnectAttemptsSubject.next(currentAttempts + 1);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttemptsSubject.next(0);
    });

    // Application events
    this.socket.on('order_update', (data: OrderUpdate) => {
      this.messageSubject.next(data);
      this.orderUpdateSubject.next(data);
    });

    this.socket.on('inventory_alert', (data: InventoryAlert) => {
      this.messageSubject.next(data);
      this.inventoryAlertSubject.next(data);
    });

    this.socket.on('notification', (data: NotificationMessage) => {
      this.messageSubject.next(data);
      this.notificationSubject.next(data);
    });

    // Generic message handler
    this.socket.on('message', (data: WebSocketMessage) => {
      this.messageSubject.next(data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.connectionErrorSubject.next(error.message || 'Socket error');
    });
  }

  /**
   * Join appropriate rooms based on user context
   */
  private joinRooms(): void {
    if (!this.socket || !this.socket.connected) return;

    // Join user-specific room
    if (this.userId) {
      this.socket.emit('join_user', { userId: this.userId });
    }

    // Join cafe-specific room
    if (this.cafeId) {
      this.socket.emit('join_cafe', { cafeId: this.cafeId });
    }

    // Join role-specific rooms
    if (this.userRole && this.cafeId) {
      if (['ADMIN', 'MANAGER', 'KITCHEN_STAFF'].includes(this.userRole)) {
        this.socket.emit('join_kitchen', { cafeId: this.cafeId });
      }

      if (['ADMIN', 'MANAGER', 'CASHIER'].includes(this.userRole)) {
        this.socket.emit('join_orders', { cafeId: this.cafeId });
      }

      if (['ADMIN', 'MANAGER'].includes(this.userRole)) {
        this.socket.emit('join_management', { cafeId: this.cafeId });
      }
    }
  }

  /**
   * Update user context
   */
  updateUserContext(userContext: {
    userId: string;
    cafeId: string;
    userRole: string;
  }): void {
    const wasConnected = this.isConnectedSubject.value;

    this.userId = userContext.userId;
    this.cafeId = userContext.cafeId;
    this.userRole = userContext.userRole;

    // Rejoin rooms if connected
    if (wasConnected && this.socket?.connected) {
      this.joinRooms()
    }
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
    this.disconnect()
  }

  /**
   * Test connection
   */
  testConnection(): Observable<boolean> {
    return new Observable(observer => {
      if (!this.socket || !this.socket.connected) {
        observer.next(false);
        observer.complete()
        return;
      }

      const timeout = setTimeout(() => {
        observer.next(false);
        observer.complete()
      }, 5000);

      this.socket.emit('ping', { timestamp: Date.now() });
      this.socket.once('pong', () => {
        clearTimeout(timeout);
        observer.next(true);
        observer.complete()
      });
    });
  }

  /**
   * Get socket latency
   */
  measureLatency(): Observable<number> {
    return new Observable(observer => {
      if (!this.socket || !this.socket.connected) {
        observer.error(new Error('Socket not connected'));
        return;
      }

      const start = Date.now()

      this.socket.emit('ping', { timestamp: start });
      this.socket.once('pong', () => {
        const latency = Date.now() - start;
        observer.next(latency);
        observer.complete()
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.error(new Error('Latency measurement timeout'));
      }, 10000);
    });
  }
}