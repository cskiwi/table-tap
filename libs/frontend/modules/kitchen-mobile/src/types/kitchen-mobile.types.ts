import { Order, OrderItem } from '@app/models';
import { OrderStatus } from '@app/models/enums';

export interface KitchenOrder extends Omit<Order, 'notes' | 'updatedAt' | 'deletedAt'> {
  estimatedPrepTime: number;
  priority: OrderPriority;
  station: KitchenStation;
  timerStarted?: boolean;
  timerElapsed?: number;
  notes?: string[];
  allergens?: string[];
  // Ensure items property is properly typed for kitchen usage
  items: KitchenOrderItem[];
  // Ensure status is accessible for kitchen operations
  status: OrderStatus;
  // Ensure required properties from Order are available
  id: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  completedAt?: Date;
}

export interface KitchenOrderItem extends OrderItem {
  prepTime: number;
  station: KitchenStation;
  modificationNotes?: string;
  allergens?: string[]
  isReady: boolean;
  // Add missing properties from OrderItem
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName: string;
  name?: string; // For compatibility with kitchen display
}

export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum KitchenStation {
  GRILL = 'grill',
  FRYER = 'fryer',
  SALAD = 'salad',
  DESSERT = 'dessert',
  DRINKS = 'drinks',
  EXPEDITE = 'expedite',
}

export interface KitchenConfig {
  stationEnabled: Record<KitchenStation, boolean>;
  voiceControlEnabled: boolean;
  barcodeScannerEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoTimerStart: boolean;
  maxOrdersPerView: number;
  refreshInterval: number;
}

export interface KitchenStats {
  ordersCompleted: number;
  averagePrepTime: number;
  currentWaitTime: number;
  ordersInProgress: number;
  stationWorkload: Record<KitchenStation, number>;
}

export interface TimerState {
  orderId: string;
  startTime: number;
  duration: number;
  isRunning: boolean;
  isPaused: boolean;
  remainingTime: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string;
  currentStock: number;
  minStock: number;
  unit: string;
  lastUpdated: Date;
  location: string;
}

export interface BarcodeScanResult {
  text: string;
  format: string;
  timestamp: Date;
  confidence?: number;
}