export interface AdminDashboardMetrics {
  todayRevenue: number,
  todayOrders: number,
  activeEmployees: number,
  lowStockItems: number,
  pendingOrders: number,
  averageOrderValue: number,
  customerCount: number,
  inventoryValue: number
}

export interface RevenueMetrics {
  today: number,
  yesterday: number,
  thisWeek: number,
  lastWeek: number,
  thisMonth: number,
  lastMonth: number,
  growth: {
    daily: number,
    weekly: number,
    monthly: number
  }
}

export interface OrderMetrics {
  total: number,
  pending: number,
  preparing: number,
  ready: number,
  completed: number,
  cancelled: number,
  averageTime: number,
  peakHours: { hour: number; count: number }[]
}

export interface InventoryAlert {
  id: string,
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING' | 'OVERSTOCKED';
  itemName: string,
  sku: string,
  currentStock: number
  minimumStock?: number
  expiryDate?: Date
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string,
  createdAt: Date
}

export interface EmployeePerformance {
  employeeId: string,
  employeeName: string,
  position: string,
  ordersProcessed: number,
  averageOrderTime: number,
  customerRating: number,
  hoursWorked: number,
  efficiency: number,
  currentStatus: 'CLOCKED_IN' | 'CLOCKED_OUT' | 'ON_BREAK' | 'INACTIVE';
}

export interface SalesAnalytics {
  totalRevenue: number,
  orderCount: number,
  averageOrderValue: number,
  topProducts: {
    productId: string,
    productName: string,
    quantity: number,
    revenue: number
  }[]
  revenueByHour: { hour: number; revenue: number }[]
  revenueByDay: { date: string; revenue: number }[]
  paymentMethods: { method: string; amount: number; percentage: number }[]
}

export interface AdminSettings {
  general: {
    cafeName: string,
    timezone: string,
    currency: string,
    taxRate: number,
    serviceCharge: number
  },
  operations: {
    orderTimeout: number,
    autoAssignOrders: boolean,
    requirePaymentConfirmation: boolean,
    allowCancellations: boolean,
    maxOrdersPerCustomer: number
  }
  notifications: {
    emailNotifications: boolean,
    smsNotifications: boolean,
    pushNotifications: boolean,
    lowStockThreshold: number,
    orderDelayThreshold: number
  },
  integrations: {
    paymentGateway: string,
    posSystem: string,
    accountingSystem: string,
    inventorySystem: string
  }
}

export interface AdminNavigationItem {
  label: string,
  icon: string,
  route: string
  badge?: number
  children?: AdminNavigationItem[]
  permissions?: string[]
}

export interface AdminTableColumn {
  field: string,
  header: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'date' | 'currency' | 'status' | 'action';
}

export interface AdminFilterOption {
  label: string,
  value: any
  icon?: string
}

export interface AdminDateRange {
  startDate: Date,
  endDate: Date
  preset?: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';
}

export interface AdminExportOptions {
  format: 'CSV' | 'PDF' | 'EXCEL';
  includeHeaders: boolean
  dateRange?: AdminDateRange
  filters?: Record<string, any>;
}

export type AdminPermission =
  | 'VIEW_DASHBOARD'
  | 'MANAGE_ORDERS'
  | 'MANAGE_INVENTORY'
  | 'MANAGE_EMPLOYEES'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_SETTINGS'
  | 'EXPORT_DATA'
  | 'MANAGE_PAYMENTS'
  | 'MANAGE_CUSTOMERS';

export interface AdminUser {
  id: string,
  name: string,
  email: string,
  role: string,
  permissions: AdminPermission[],
  cafeId: string
  lastLogin?: Date
  profileImage?: string
}

export interface AdminNotification {
  id: string,
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string,
  message: string,
  timestamp: Date,
  read: boolean
  actionUrl?: string
  actionLabel?: string
}

export interface ChartDataPoint {
  label: string,
  value: number
  color?: string
}

export interface TimeSeriesData {
  date: string,
  value: number
  category?: string
}

export interface AdminModalConfig {
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean
  data?: any
}