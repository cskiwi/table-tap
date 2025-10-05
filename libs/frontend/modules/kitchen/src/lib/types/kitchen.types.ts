import { Order, OrderItem, Product, Employee, Counter } from '@app/models';

export interface KitchenOrder extends Order {
  items: KitchenOrderItem[]
  assignedStaff?: Employee;
  estimatedCompletionTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  preparationSteps?: KitchenStep[]
  priority: OrderPriority;
}

export interface KitchenOrderItem extends OrderItem {
  preparationStatus: PreparationStatus;
  assignedCounter?: Counter;
  preparationStartTime?: Date;
  preparationEndTime?: Date;
  cookingInstructions?: string;
  allergiesNotes?: string;
  modificationNotes?: string;
}

export interface KitchenStep {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // in minutes
  status: StepStatus;
  assignedStaffId?: string;
  startTime?: Date;
  endTime?: Date;
  counterId?: string;
  dependencies?: string[]; // step IDs that must be completed first
  instructions?: string;
}

export interface KitchenTimer {
  id: string;
  orderId: string;
  orderItemId?: string;
  stepId?: string;
  name: string;
  duration: number; // in seconds
  remainingTime: number;
  status: TimerStatus;
  type: TimerType;
  priority: TimerPriority;
  createdAt: Date;
  startedAt?: Date;
  pausedAt?: Date;
  completedAt?: Date;
  sound: boolean;
  vibration: boolean;
}

export interface KitchenMetrics {
  averageOrderPrepTime: number;
  ordersCompleted: number;
  ordersInProgress: number;
  ordersPending: number;
  efficiency: number; // percentage
  qualityScore: number;
  staffPerformance: StaffPerformance[]
  countersUtilization: CounterUtilization[]
  todayStats: DailyStats;
  hourlyStats: HourlyStats[]
}

export interface StaffPerformance {
  employeeId: string;
  employee: Employee;
  ordersCompleted: number;
  averagePrepTime: number;
  qualityScore: number;
  efficiency: number;
  tasksCompleted: number;
  hoursWorked: number;
  currentTask?: string;
  status: StaffStatus;
}

export interface CounterUtilization {
  counterId: string;
  counter: Counter;
  utilizationRate: number; // percentage
  ordersProcessed: number;
  averageOrderTime: number;
  currentOrders: number;
  maxCapacity: number;
  status: CounterStatus;
}

export interface DailyStats {
  date: Date;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averagePrepTime: number;
  revenue: number;
  efficiency: number;
}

export interface HourlyStats {
  hour: number;
  orders: number;
  averagePrepTime: number;
  efficiency: number;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  product: Product;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface QualityControl {
  id: string;
  orderId: string;
  orderItemId?: string;
  checklistItems: QualityCheckItem[]
  overallScore: number;
  comments?: string;
  checkedBy: string;
  checkedAt: Date;
  approved: boolean;
  rejectionReason?: string;
}

export interface QualityCheckItem {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  required: boolean;
  notes?: string;
}

export interface KitchenStation {
  id: string;
  name: string;
  type: StationType;
  counter: Counter;
  currentOrders: KitchenOrder[]
  assignedStaff: Employee[]
  capacity: number;
  status: StationStatus;
  equipment: KitchenEquipment[]
  averageProcessingTime: number;
}

export interface KitchenEquipment {
  id: string;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  temperature?: number;
  maxTemperature?: number;
  currentUsage?: number;
  maxUsage?: number;
}

// Enums
export enum PreparationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  FAILED = 'failed',
}

export enum TimerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum TimerType {
  COOKING = 'cooking',
  PREPARATION = 'preparation',
  REST = 'rest',
  COOLING = 'cooling',
  SERVING = 'serving',
  CUSTOM = 'custom',
}

export enum TimerPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  RUSH = 'rush',
}

export enum StaffStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  BREAK = 'break',
  OFFLINE = 'offline',
  TRAINING = 'training',
}

export enum CounterStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  FULL = 'full',
}

export enum AlertType {
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRED = 'expired',
  TEMPERATURE = 'temperature',
  EQUIPMENT = 'equipment',
  QUALITY = 'quality',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum StationType {
  PREP = 'prep',
  GRILL = 'grill',
  FRYER = 'fryer',
  COLD_STATION = 'cold_station',
  DESSERT = 'dessert',
  DRINKS = 'drinks',
  PACKAGING = 'packaging',
  EXPEDITE = 'expedite',
}

export enum StationStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  CLEANING = 'cleaning',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
}

export enum EquipmentType {
  OVEN = 'oven',
  GRILL = 'grill',
  FRYER = 'fryer',
  REFRIGERATOR = 'refrigerator',
  FREEZER = 'freezer',
  MIXER = 'mixer',
  BLENDER = 'blender',
  COFFEE_MACHINE = 'coffee_machine',
  DISHWASHER = 'dishwasher',
}

export enum EquipmentStatus {
  OPERATIONAL = 'operational',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  BROKEN = 'broken',
  CLEANING = 'cleaning',
}

// Filter and Sort interfaces
export interface KitchenFilters {
  status?: PreparationStatus[]
  priority?: OrderPriority[]
  assignedStaff?: string[]
  counter?: string[]
  dateRange?: {
    start: Date;
    end: Date;
  }
  orderType?: string[]
}

export interface KitchenDisplaySettings {
  showTimers: boolean;
  showNotes: boolean;
  showAllergies: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  productTypes: string[]
  steps: KitchenStep[]
  estimatedTotalTime: number;
  parallelSteps: string[][]
  isActive: boolean;
}