/**
 * Core type definitions for the restaurant ordering system services
 */

// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[]
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  }
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}

// Order-related types
export interface Order extends BaseEntity {
  orderNumber: string;
  customerId?: string;
  tableId?: string;
  items: OrderItem[]
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  tax: number;
  tip?: number;
  paymentStatus: PaymentStatus;
  orderType: OrderType;
  notes?: string;
  estimatedTime?: number;
  actualTime?: number;
  cafeId: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?: ProductCustomization[]
  notes?: string;
}

export interface ProductCustomization {
  id: string;
  name: string;
  value: string;
  additionalPrice: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
  CURBSIDE = 'CURBSIDE'
}

// Product-related types
export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category: ProductCategory;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number;
  allergens?: string[]
  nutritionalInfo?: NutritionalInfo;
  customizationOptions?: CustomizationOption[]
  ingredients?: Ingredient[]
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
  cafeId: string;
}

export interface ProductCategory extends BaseEntity {
  name: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  cafeId: string;
}

export interface CustomizationOption {
  id: string;
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  required: boolean;
  options: CustomizationValue[]
}

export interface CustomizationValue {
  id: string;
  name: string;
  additionalPrice: number;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface Ingredient extends BaseEntity {
  name: string;
  isAllergen: boolean;
  stockLevel?: number;
  unit?: string;
}

// Payment-related types
export interface Payment extends BaseEntity {
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: any;
  refundedAmount?: number;
  failureReason?: string;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  QR_CODE = 'QR_CODE',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export interface QRCodePayment {
  qrCode: string;
  expiresAt: Date;
  amount: number;
  orderId: string;
  isUsed: boolean;
}

// Employee-related types
export interface Employee extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: EmployeeRole;
  isActive: boolean;
  hourlyRate?: number;
  cafeId: string;
  permissions: Permission[]
}

export enum EmployeeRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
  WAITER = 'WAITER',
  BARISTA = 'BARISTA'
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface TimeEntry extends BaseEntity {
  employeeId: string;
  clockIn: Date;
  clockOut?: Date;
  totalHours?: number;
  notes?: string;
  location?: string;
}

// Inventory-related types
export interface InventoryItem extends BaseEntity {
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  unitCost: number;
  supplierId?: string;
  lastRestocked?: Date;
  expiryDate?: Date;
  location?: string;
  cafeId: string;
}

export interface StockMovement extends BaseEntity {
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  performedBy: string;
  cost?: number;
  reference?: string;
}

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  WASTE = 'WASTE',
  TRANSFER = 'TRANSFER'
}

// Cafe/Restaurant-related types
export interface Cafe extends BaseEntity {
  name: string;
  address: Address;
  phone: string;
  email: string;
  website?: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  settings: CafeSettings;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface CafeSettings {
  taxRate: number;
  serviceFeeRate?: number;
  autoAcceptOrders: boolean;
  orderTimeoutMinutes: number;
  allowTips: boolean;
  defaultTipPercentages: number[]
  printReceipts: boolean;
  sendEmailReceipts: boolean;
  currency: string;
  paymentMethods: PaymentMethod[]
}

export interface Table extends BaseEntity {
  number: string;
  capacity: number;
  isOccupied: boolean;
  qrCode?: string;
  location?: string;
  cafeId: string;
}

// Real-time types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
  cafeId?: string;
}

export interface OrderUpdate extends WebSocketMessage {
  type: 'ORDER_UPDATE';
  payload: {
    orderId: string;
    status: OrderStatus;
    estimatedTime?: number;
    message?: string;
  }
}

export interface InventoryAlert extends WebSocketMessage {
  type: 'INVENTORY_ALERT';
  payload: {
    itemId: string;
    itemName: string;
    currentStock: number;
    minimumStock: number;
    severity: 'LOW' | 'CRITICAL';
  }
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'NOTIFICATION';
  payload: {
    id: string;
    title: string;
    message: string;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    action?: {
      label: string;
      url: string;
    }
  }
}

// Authentication types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  permissions: string[]
  cafeId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CAFE_ADMIN = 'CAFE_ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER'
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  }
  defaultCurrency?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface BiometricConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'voice';
  fallbackToPassword: boolean;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  path?: string;
  statusCode?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Configuration types
export interface ServiceConfig {
  apiBaseUrl: string;
  graphqlEndpoint: string;
  websocketUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCaching: boolean;
  cacheTimeout: number;
  enableOfflineMode: boolean;
}

export interface CacheConfig {
  keyPrefix: string;
  defaultTTL: number;
  maxSize: number;
  storage: 'memory' | 'localStorage' | 'sessionStorage';
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export interface PerformanceMetrics {
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  errorCount: number;
  userActions: number;
  timestamp: Date;
}

// State management types
export interface AppState {
  auth: AuthState;
  orders: OrderState;
  products: ProductState;
  inventory: InventoryState;
  ui: UIState;
  offline: OfflineState;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface OrderState {
  currentOrder: Order | null;
  orderHistory: Order[]
  cartItems: OrderItem[]
  isLoading: boolean;
  error: string | null;
}

export interface ProductState {
  products: Product[]
  categories: ProductCategory[]
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface InventoryState {
  items: InventoryItem[]
  alerts: InventoryAlert[]
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  loading: boolean;
  notifications: NotificationMessage[]
}

export interface OfflineState {
  isOnline: boolean;
  pendingActions: any[]
  lastSyncTime: Date | null;
}