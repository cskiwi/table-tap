// Core interfaces for the restaurant ordering system

export interface Restaurant {
  id: string;
  name: string;
  logo?: string;
  theme: RestaurantTheme;
  settings: RestaurantSettings;
  counters: Counter[];
  categories: Category[];
  created_at: Date;
  updated_at: Date;
}

export interface RestaurantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
  customCss?: string;
}

export interface RestaurantSettings {
  currency: string;
  taxRate: number;
  serviceChargeRate: number;
  orderTimeout: number; // minutes
  maxOrdersPerCustomer: number;
  allowModifications: boolean;
  autoAcceptOrders: boolean;
  kitchenDisplayEnabled: boolean;
  counterDisplayEnabled: boolean;
}

export interface Counter {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  preparationTimeMinutes: number;
  maxConcurrentOrders: number;
  categories: string[]; // category IDs
  employees: string[]; // employee IDs
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  products: Product[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isActive: boolean;
  preparationTimeMinutes: number;
  categoryId: string;
  counterId: string;
  allergens: string[];
  nutritionalInfo?: NutritionalInfo;
  customizations: ProductCustomization[];
  tags: string[];
}

export interface ProductCustomization {
  id: string;
  type: 'size' | 'addon' | 'option' | 'ingredient';
  name: string;
  options: CustomizationOption[];
  required: boolean;
  maxSelections: number;
}

export interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface Order {
  id: string;
  customerId?: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  estimatedPreparationTime: number;
  actualPreparationTime?: number;
  qrCode: string;
  tableNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  timeline: OrderEvent[];
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations: SelectedCustomization[];
  specialInstructions?: string;
  status: OrderItemStatus;
}

export interface SelectedCustomization {
  customizationId: string;
  optionId: string;
  name: string;
  priceModifier: number;
}

export interface OrderEvent {
  id: string;
  type: OrderEventType;
  description: string;
  timestamp: Date;
  employeeId?: string;
  employeeName?: string;
}

export type OrderStatus = 
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export type PaymentMethod = 
  | 'cash'
  | 'card'
  | 'mobile_payment'
  | 'qr_code'
  | 'employee_meal';

export type OrderItemStatus = 
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'served';

export type OrderEventType = 
  | 'created'
  | 'payment_received'
  | 'confirmed'
  | 'preparation_started'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'modified';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  isActive: boolean;
  pin: string;
  permissions: Permission[];
  shift?: Shift;
  performance: EmployeePerformance;
  personalOrders: Order[];
}

export type EmployeeRole = 
  | 'admin'
  | 'manager'
  | 'kitchen_staff'
  | 'counter_staff'
  | 'server'
  | 'cleaner';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface Shift {
  id: string;
  employeeId: string;
  startTime: Date;
  endTime?: Date;
  breakStartTime?: Date;
  breakEndTime?: Date;
  totalHours?: number;
  status: 'active' | 'break' | 'completed';
}

export interface EmployeePerformance {
  ordersProcessed: number;
  averageOrderTime: number;
  customerRating: number;
  tasksCompleted: number;
  punctualityScore: number;
}

export interface Analytics {
  period: AnalyticsPeriod;
  revenue: RevenueMetrics;
  orders: OrderMetrics;
  products: ProductMetrics;
  employees: EmployeeMetrics;
  customers: CustomerMetrics;
}

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year';

export interface RevenueMetrics {
  total: number;
  growth: number;
  averageOrderValue: number;
  peakHours: { hour: number; revenue: number }[];
  paymentMethodBreakdown: { method: PaymentMethod; amount: number; percentage: number }[];
}

export interface OrderMetrics {
  total: number;
  completed: number;
  cancelled: number;
  averagePreparationTime: number;
  peakOrderTimes: { hour: number; count: number }[];
  statusBreakdown: { status: OrderStatus; count: number; percentage: number }[];
}

export interface ProductMetrics {
  topSelling: { product: Product; quantity: number; revenue: number }[];
  lowPerforming: { product: Product; quantity: number }[];
  categoryPerformance: { category: Category; orders: number; revenue: number }[];
}

export interface EmployeeMetrics {
  totalHours: number;
  productivity: { employee: Employee; ordersProcessed: number; efficiency: number }[];
  attendance: { employee: Employee; hoursWorked: number; punctuality: number }[];
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageOrderFrequency: number;
  satisfactionScore: number;
}

export interface Inventory {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  costPerUnit: number;
  supplier?: string;
  lastRestocked: Date;
  expiryDate?: Date;
  status: InventoryStatus;
}

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  recipientIds: string[];
  data?: any;
  createdAt: Date;
  expiresAt?: Date;
}

export type NotificationType = 
  | 'new_order'
  | 'order_ready'
  | 'payment_received'
  | 'low_stock'
  | 'employee_clock_in'
  | 'system_alert'
  | 'promotion';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component-specific interfaces
export interface MenuGridConfig {
  columns: number;
  showPrices: boolean;
  showImages: boolean;
  showDescriptions: boolean;
  categoryFilter: boolean;
  searchEnabled: boolean;
  sortOptions: ('name' | 'price' | 'popularity')[];
}

export interface OrderSummaryConfig {
  showImages: boolean;
  allowQuantityEdit: boolean;
  showCustomizations: boolean;
  showPreparationTime: boolean;
  autoCalculateTotals: boolean;
}

export interface PaymentFlowConfig {
  acceptedMethods: PaymentMethod[];
  requireCustomerInfo: boolean;
  showQRCode: boolean;
  autoGenerateReceipt: boolean;
  minimumOrderAmount?: number;
}

export interface KitchenDisplayConfig {
  columns: number;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  showCustomerNames: boolean;
  showEstimatedTimes: boolean;
  soundNotifications: boolean;
  maxDisplayedOrders: number;
}

export interface DashboardWidgetConfig {
  type: 'chart' | 'metric' | 'list' | 'table';
  title: string;
  refreshInterval?: number;
  dataSource: string;
  filters?: Record<string, any>;
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
}

// Form validation interfaces
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'radio' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
  validationRules: ValidationRule[];
  disabled?: boolean;
  hidden?: boolean;
}

// Real-time event interfaces
export interface SocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
  source: 'kitchen' | 'counter' | 'customer' | 'admin' | 'system';
}

export interface OrderUpdateEvent extends SocketEvent {
  type: 'order_update';
  payload: {
    orderId: string;
    status: OrderStatus;
    estimatedTime?: number;
  };
}

export interface InventoryUpdateEvent extends SocketEvent {
  type: 'inventory_update';
  payload: {
    itemId: string;
    currentStock: number;
    status: InventoryStatus;
  };
}

export interface EmployeeUpdateEvent extends SocketEvent {
  type: 'employee_update';
  payload: {
    employeeId: string;
    action: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
    timestamp: Date;
  };
}
