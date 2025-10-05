export interface KitchenNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: Date;
  data?: any;
  actions?: NotificationAction[]
  persistent: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export enum NotificationType {
  NEW_ORDER = 'new_order',
  ORDER_URGENT = 'order_urgent',
  TIMER_EXPIRED = 'timer_expired',
  TIMER_WARNING = 'timer_warning',
  INVENTORY_LOW = 'inventory_low',
  SYSTEM_MESSAGE = 'system_message',
  ERROR = 'error',
  SUCCESS = 'success',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  style: 'default' | 'destructive' | 'cancel';
}

export interface NotificationConfig {
  enablePush: boolean;
  enableSound: boolean;
  enableVibration: boolean;
  quietHours: QuietHours;
  priorityFilter: NotificationPriority[]
  typeFilter: NotificationType[]
  maxNotifications: number;
  autoCloseDelay: number;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  allowCritical: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  }
}