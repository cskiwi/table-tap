/**
 * Common interfaces for the restaurant ordering system
 */

// Base Entity Interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
}

// User Related Interfaces
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
}

export enum UserRole {
  CUSTOMER = 'customer',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

// Order Related Interfaces
export interface Order extends BaseEntity {
  orderNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  tax: number;
  discount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderType: OrderType;
  tableNumber?: string;
  notes?: string;
  estimatedReadyTime?: Date;
  completedAt?: Date;
  qrCode?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?: OrderItemCustomization[];
  notes?: string;
}

export interface OrderItemCustomization {
  id: string;
  name: string;
  value: string;
  additionalPrice: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  MOBILE = 'mobile',
  QR_CODE = 'qr_code',
  WALLET = 'wallet'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Product Related Interfaces
export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName: string;
  images: string[];
  isAvailable: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  calories?: number;
  preparationTime: number;
  customizations?: ProductCustomization[];
  tags: string[];
  stockQuantity?: number;
  minStockLevel?: number;
}

export interface ProductCustomization {
  id: string;
  name: string;
  type: CustomizationType;
  options: CustomizationOption[];
  required: boolean;
  maxSelections?: number;
}

export interface CustomizationOption {
  id: string;
  name: string;
  additionalPrice: number;
  isAvailable: boolean;
}

export enum CustomizationType {
  SINGLE_SELECT = 'single_select',
  MULTI_SELECT = 'multi_select',
  TEXT_INPUT = 'text_input',
  NUMBER_INPUT = 'number_input'
}

// Category Interface
export interface Category extends BaseEntity {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  parentCategoryId?: string;
}

// Inventory Related Interfaces
export interface InventoryItem extends BaseEntity {
  name: string;
  description?: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  costPerUnit: number;
  supplierId?: string;
  supplierName?: string;
  expiryDate?: Date;
  location?: string;
  status: InventoryStatus;
}

export enum InventoryStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRED = 'expired'
}

// Employee Related Interfaces
export interface Employee extends User {
  employeeId: string;
  position: string;
  department: string;
  hireDate: Date;
  hourlyRate: number;
  isClocked: boolean;
  currentShift?: Shift;
}

export interface Shift extends BaseEntity {
  employeeId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  breakDuration: number;
  totalHours?: number;
  notes?: string;
}

// Analytics Interfaces
export interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: ProductSalesData[];
  salesByHour: HourlySalesData[];
  salesByCategory: CategorySalesData[];
  period: DateRange;
}

export interface ProductSalesData {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface HourlySalesData {
  hour: number;
  orders: number;
  revenue: number;
}

export interface CategorySalesData {
  categoryId: string;
  categoryName: string;
  orders: number;
  revenue: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// UI Related Interfaces
export interface ComponentConfig {
  theme?: PrimeNGTheme;
  responsive?: ResponsiveConfig;
  accessibility?: AccessibilityConfig;
}

export interface PrimeNGTheme {
  primary: string;
  secondary: string;
  surface: string;
  accent: string;
}

export interface ResponsiveConfig {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
}

export interface AccessibilityConfig {
  ariaLabels: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
}

// Notification Interfaces
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  userId?: string;
}

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_READY = 'order_ready',
  PAYMENT_PROCESSED = 'payment_processed',
  INVENTORY_LOW = 'inventory_low',
  EMPLOYEE_CLOCKED = 'employee_clocked',
  SYSTEM_ALERT = 'system_alert'
}

// API Response Interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Form Interfaces
export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

export interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
}

export enum FieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PASSWORD = 'password',
  NUMBER = 'number',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  TEXTAREA = 'textarea',
  DATE = 'date',
  TIME = 'time'
}

export enum ValidationType {
  REQUIRED = 'required',
  EMAIL = 'email',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  MIN_VALUE = 'min',
  MAX_VALUE = 'max',
  PATTERN = 'pattern'
}