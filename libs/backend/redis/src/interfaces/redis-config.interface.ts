import { RedisOptions } from 'ioredis';

export interface RedisModuleOptions {
  redis: RedisOptions;
  cluster?: {
    enabled: boolean;
    nodes: Array<{ host: string; port: number }>;
    options?: any;
  }
  pubsub?: {
    retryDelayOnFailover?: number;
    maxRetriesPerRequest?: number;
    lazyConnect?: boolean;
  }
  cache?: {
    defaultTTL?: number;
    maxMemoryPolicy?: string;
    keyPrefix?: string;
  }
  session?: {
    ttl?: number;
    keyPrefix?: string;
  }
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
  namespace?: string;
}

export interface PubSubMessage<T = any> {
  pattern: string;
  channel: string;
  data: T;
  timestamp: Date;
  messageId?: string;
}

export interface SessionData {
  userId: string;
  cafeId?: string;
  role: string;
  permissions: string[]
  lastActivity: Date;
  metadata?: Record<string, any>;
}

export enum RedisEventType {
  ORDER_CREATED = 'order:created',
  ORDER_STATUS_UPDATED = 'order:status_updated',
  ORDER_ASSIGNED = 'order:assigned',
  KITCHEN_NOTIFICATION = 'kitchen:notification',
  COUNTER_ASSIGNMENT = 'counter:assignment',
  INVENTORY_UPDATED = 'inventory:updated',
  CAFE_STATUS_CHANGED = 'cafe:status_changed',
  EMPLOYEE_LOGIN = 'employee:login',
  EMPLOYEE_LOGOUT = 'employee:logout',
  SYSTEM_ALERT = 'system:alert'
}

export interface OrderEvent {
  orderId: string;
  orderNumber: string;
  cafeId: string;
  customerId: string;
  status?: string;
  counterId?: string;
  metadata?: Record<string, any>;
}

export interface KitchenNotification {
  orderId: string;
  orderNumber: string;
  cafeId: string;
  counterId?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    customizations?: string[]
  }>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedReadyTime?: Date;
}

export interface CounterAssignment {
  orderId: string;
  orderNumber: string;
  counterId: string;
  counterName: string;
  cafeId: string;
  assignedBy: string;
  assignedAt: Date;
}