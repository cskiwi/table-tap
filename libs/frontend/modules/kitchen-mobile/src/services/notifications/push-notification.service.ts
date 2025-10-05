import { Injectable, NgZone } from '@angular/core';
import { Observable, BehaviorSubject, fromEvent } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { SwUpdate } from '@angular/service-worker';
import {
  KitchenNotification,
  NotificationType,
  NotificationPriority,
  NotificationConfig,
  PushSubscription as KitchenPushSubscription
} from '../../types';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private notifications$ = new BehaviorSubject<KitchenNotification[]>([]);
  private isSupported$ = new BehaviorSubject<boolean>(false);
  private permission$ = new BehaviorSubject<NotificationPermission>('default');
  private subscription$ = new BehaviorSubject<KitchenPushSubscription | null>(null);

  private readonly defaultConfig: NotificationConfig = {
    enablePush: true,
    enableSound: true,
    enableVibration: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '06:00',
      allowCritical: true
    },
    priorityFilter: [NotificationPriority.LOW, NotificationPriority.NORMAL, NotificationPriority.HIGH, NotificationPriority.CRITICAL],
    typeFilter: Object.values(NotificationType),
    maxNotifications: 10,
    autoCloseDelay: 5000
  };

  private config: NotificationConfig = { ...this.defaultConfig };

  // VAPID public key for push notifications
  private readonly VAPID_PUBLIC_KEY = 'BKd-example-key-replace-with-real-vapid-key';

  constructor(
    private swUpdate: SwUpdate,
    private ngZone: NgZone
  ) {
    this.initializeNotifications();
  }

  get notifications(): Observable<KitchenNotification[]> {
    return this.notifications$.asObservable()
  }

  get isSupported(): Observable<boolean> {
    return this.isSupported$.asObservable()
  }

  get permission(): Observable<NotificationPermission> {
    return this.permission$.asObservable()
  }

  get subscription(): Observable<KitchenPushSubscription | null> {
    return this.subscription$.asObservable()
  }

  private initializeNotifications(): void {
    // Check support
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    this.isSupported$.next(supported);

    if (!supported) {
      console.warn('Push notifications not supported');
      return;
    }

    // Get current permission
    this.permission$.next(Notification.permission);

    // Listen for permission changes
    if ('permissions' in navigator) {
      (navigator as any).permissions.query({ name: 'notifications' }).then((result: any) => {
        result.addEventListener('change', () => {
          this.ngZone.run(() => {
            this.permission$.next(result.state);
          });
        });
      });
    }

    // Initialize service worker notifications
    this.initializeServiceWorkerNotifications()
  }

  private async initializeServiceWorkerNotifications(): Promise<void> {
    if (!this.swUpdate.isEnabled) return;

    try {
      const registration = await navigator.serviceWorker.ready;

      // Listen for push events
      fromEvent(registration, 'push').subscribe((event: any) => {
        this.handlePushEvent(event);
      });

      // Get existing subscription
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        this.subscription$.next(this.subscriptionToKitchen(existingSubscription));
      }
    } catch (error) {
      console.error('Failed to initialize service worker notifications:', error);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported$.value) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission()
    this.permission$.next(permission);
    return permission;
  }

  async subscribeToPush(): Promise<KitchenPushSubscription> {
    if (!this.swUpdate.isEnabled) {
      throw new Error('Service worker not enabled');
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
      });

      const kitchenSubscription = this.subscriptionToKitchen(subscription);
      this.subscription$.next(kitchenSubscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(kitchenSubscription);

      return kitchenSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  async unsubscribeFromPush(): Promise<void> {
    const currentSubscription = this.subscription$.value;
    if (!currentSubscription) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        this.subscription$.next(null);

        // Notify server
        await this.removeSubscriptionFromServer(currentSubscription);
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  async showNotification(notification: Omit<KitchenNotification, 'id' | 'timestamp'>): Promise<void> {
    const fullNotification: KitchenNotification = {
      ...notification,
      id: this.generateNotificationId(),
      timestamp: new Date()
    }

    // Check if notification should be shown
    if (!this.shouldShowNotification(fullNotification)) {
      return;
    }

    // Add to notifications list
    this.addNotification(fullNotification);

    // Show system notification if permission granted
    if (this.permission$.value === 'granted') {
      await this.showSystemNotification(fullNotification);
    }

    // Play sound if enabled
    if (fullNotification.soundEnabled && this.config.enableSound) {
      this.playNotificationSound(fullNotification.type);
    }

    // Vibrate if enabled and supported
    if (fullNotification.vibrationEnabled && this.config.enableVibration && 'vibrate' in navigator) {
      this.vibrateForNotification(fullNotification.priority);
    }

    // Auto-close after delay
    if (!fullNotification.persistent && this.config.autoCloseDelay > 0) {
      setTimeout(() => {
        this.dismissNotification(fullNotification.id);
      }, this.config.autoCloseDelay);
    }
  }

  private async showSystemNotification(notification: KitchenNotification): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;

      const options: NotificationOptions = {
        body: notification.message,
        icon: this.getNotificationIcon(notification.type),
        badge: '/assets/icons/kitchen-badge.png',
        tag: notification.type,
        // renotify: notification.priority === 'high', // renotify is not standard in NotificationOptions
        requireInteraction: notification.persistent,
        silent: !notification.soundEnabled,
        // vibrate: notification.vibrationEnabled ? this.getVibrationPattern(notification.priority) : undefined, // Not standard in NotificationOptions
        data: {
          id: notification.id,
          type: notification.type,
          data: notification.data
        },
        // actions: notification.actions?.map(action => ({ // Not supported in standard NotificationOptions
        //   action: action.id
        //   title: action.label
        //   icon: action.style === 'destructive' ? '/assets/icons/delete.png' : '/assets/icons/action.png'
        // }))
        ...(notification.actions ? {} : {}) // Actions not supported in standard NotificationOptions
      }

      await registration.showNotification(notification.title, options);
    } catch (error) {
      console.error('Failed to show system notification:', error);
    }
  }

  dismissNotification(id: string): void {
    const notifications = this.notifications$.value.filter(n => n.id !== id);
    this.notifications$.next(notifications);
  }

  dismissAllNotifications(): void {
    this.notifications$.next([]);
  }

  dismissNotificationsByType(type: NotificationType): void {
    const notifications = this.notifications$.value.filter(n => n.type !== type);
    this.notifications$.next(notifications);
  }

  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  // Notification shortcuts for common kitchen scenarios
  async notifyNewOrder(orderId: string, orderDetails: any): Promise<void> {
    await this.showNotification({
      type: NotificationType.NEW_ORDER,
      title: 'New Order',
      message: `Order #${orderId} has been placed`,
      priority: NotificationPriority.HIGH,
      data: { orderId, orderDetails },
      persistent: false,
      soundEnabled: true,
      vibrationEnabled: true,
      actions: [
        {
          id: 'view_order',
          label: 'View Order',
          action: () => this.handleOrderAction('view', orderId),
          style: 'default'
        },
        {
          id: 'start_timer',
          label: 'Start Timer',
          action: () => this.handleOrderAction('start_timer', orderId),
          style: 'default'
        }
      ]
    });
  }

  async notifyUrgentOrder(orderId: string): Promise<void> {
    await this.showNotification({
      type: NotificationType.ORDER_URGENT,
      title: 'URGENT ORDER',
      message: `Order #${orderId} is urgent!`,
      priority: NotificationPriority.CRITICAL,
      data: { orderId },
      persistent: true,
      soundEnabled: true,
      vibrationEnabled: true
    });
  }

  async notifyTimerExpired(orderId: string, itemName: string): Promise<void> {
    await this.showNotification({
      type: NotificationType.TIMER_EXPIRED,
      title: 'Timer Expired',
      message: `${itemName} timer for order #${orderId} has expired`,
      priority: NotificationPriority.HIGH,
      data: { orderId, itemName },
      persistent: false,
      soundEnabled: true,
      vibrationEnabled: true,
      actions: [
        {
          id: 'mark_ready',
          label: 'Mark Ready',
          action: () => this.handleOrderAction('mark_ready', orderId),
          style: 'default'
        },
        {
          id: 'add_time',
          label: 'Add 2 min',
          action: () => this.handleOrderAction('add_time', orderId),
          style: 'default'
        }
      ]
    });
  }

  async notifyLowInventory(itemName: string, currentStock: number): Promise<void> {
    await this.showNotification({
      type: NotificationType.INVENTORY_LOW,
      title: 'Low Inventory',
      message: `${itemName} is running low (${currentStock} remaining)`,
      priority: NotificationPriority.NORMAL,
      data: { itemName, currentStock },
      persistent: false,
      soundEnabled: false,
      vibrationEnabled: false
    });
  }

  private shouldShowNotification(notification: KitchenNotification): boolean {
    // Check config filters
    if (!this.config.priorityFilter.includes(notification.priority)) {
      return false;
    }

    if (!this.config.typeFilter.includes(notification.type)) {
      return false;
    }

    // Check quiet hours
    if (this.config.quietHours.enabled && !this.isInQuietHours(notification)) {
      return false;
    }

    // Check max notifications limit
    if (this.notifications$.value.length >= this.config.maxNotifications) {
      // Remove oldest non-persistent notification
      const notifications = this.notifications$.value;
      const nonPersistent = notifications.findIndex(n => !n.persistent);
      if (nonPersistent > -1) {
        notifications.splice(nonPersistent, 1);
        this.notifications$.next([...notifications]);
      } else {
        return false; // All notifications are persistent
      }
    }

    return true;
  }

  private isInQuietHours(notification: KitchenNotification): boolean {
    if (!this.config.quietHours.enabled) return false;

    if (notification.priority === NotificationPriority.CRITICAL && this.config.quietHours.allowCritical) {
      return false;
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { startTime, endTime } = this.config.quietHours;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private addNotification(notification: KitchenNotification): void {
    const notifications = [notification, ...this.notifications$.value];
    this.notifications$.next(notifications);
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNotificationIcon(type: NotificationType): string {
    const iconMap = {
      [NotificationType.NEW_ORDER]: '/assets/icons/new-order.png',
      [NotificationType.ORDER_URGENT]: '/assets/icons/urgent.png',
      [NotificationType.TIMER_EXPIRED]: '/assets/icons/timer.png',
      [NotificationType.TIMER_WARNING]: '/assets/icons/timer-warning.png',
      [NotificationType.INVENTORY_LOW]: '/assets/icons/inventory.png',
      [NotificationType.SYSTEM_MESSAGE]: '/assets/icons/system.png',
      [NotificationType.ERROR]: '/assets/icons/error.png',
      [NotificationType.SUCCESS]: '/assets/icons/success.png'
    };

    return iconMap[type] || '/assets/icons/default.png';
  }

  private getVibrationPattern(priority: NotificationPriority): number[] {
    const patterns = {
      [NotificationPriority.LOW]: [100, 50, 100],
      [NotificationPriority.NORMAL]: [200, 100, 200],
      [NotificationPriority.HIGH]: [300, 100, 300, 100, 300],
      [NotificationPriority.CRITICAL]: [500, 200, 500, 200, 500, 200, 500]
    };

    return patterns[priority] || patterns[NotificationPriority.NORMAL];
  }

  private vibrateForNotification(priority: NotificationPriority): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(this.getVibrationPattern(priority));
    }
  }

  private playNotificationSound(type: NotificationType): void {
    // This would use Howler.js for audio playback
    const soundMap: Partial<Record<NotificationType, string>> = {
      [NotificationType.NEW_ORDER]: '/assets/audio/new-order.mp3',
      [NotificationType.ORDER_URGENT]: '/assets/audio/urgent.mp3',
      [NotificationType.TIMER_EXPIRED]: '/assets/audio/timer-expired.mp3',
      [NotificationType.TIMER_WARNING]: '/assets/audio/timer-warning.mp3'
    };

    const soundFile = soundMap[type];
    if (soundFile) {
      // Implementation would use Howler.js
      console.log(`Playing sound: ${soundFile}`);
    }
  }

  private handleOrderAction(action: string, orderId: string): void {
    // This would emit events for the parent components to handle
    console.log(`Handling action: ${action} for order: ${orderId}`);
  }

  private handlePushEvent(event: any): void {
    const data = event.data?.json()
    if (data) {
      this.showNotification(data);
    }
  }

  private subscriptionToKitchen(subscription: PushSubscription): KitchenPushSubscription {
    const key = subscription.getKey('p256dh');
    const token = subscription.getKey('auth');

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: key ? this.arrayBufferToBase64(key) : '',
        auth: token ? this.arrayBufferToBase64(token) : ''
      }
    };
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    return window.btoa(binary);
  }

  private async sendSubscriptionToServer(subscription: KitchenPushSubscription): Promise<void> {
    // Send subscription to your backend server
    try {
      const response = await fetch('/api/kitchen/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(subscription: KitchenPushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/kitchen/push-subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }
}