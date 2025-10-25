import { gql } from 'apollo-angular';

// Fragments
export const ADMIN_DASHBOARD_FRAGMENT = gql`
  fragment AdminDashboardFields on AdminDashboard {
    todayRevenue
    todayOrders
    activeEmployees
    lowStockItems
    pendingOrders
    averageOrderValue
    customerCount
    inventoryValue
  }
`;

export const REVENUE_METRICS_FRAGMENT = gql`
  fragment RevenueMetricsFields on RevenueMetrics {
    today
    yesterday
    thisWeek
    lastWeek
    thisMonth
    lastMonth
    dailyGrowth
    weeklyGrowth
    monthlyGrowth
    paymentMethods {
      card
      cash
      digital
      other
    }
  }
`;

export const ORDER_METRICS_FRAGMENT = gql`
  fragment OrderMetricsFields on OrderMetrics {
    total
    pending
    preparing
    ready
    completed
    cancelled
    averageTime
    peakHours {
      hour
      orderCount
    }
    orderTypes {
      dineIn
      takeaway
      delivery
    }
  }
`;

export const EMPLOYEE_PERFORMANCE_FRAGMENT = gql`
  fragment EmployeePerformanceFields on EmployeePerformance {
    employeeId
    employee {
      id
      firstName
      lastName
      position
      email
    }
    ordersProcessed
    averageTime
    rating
    efficiency
    currentStatus
    hoursWorked
    attendance {
      daysPresent
      daysAbsent
      lateArrivals
      overtimeHours
    }
  }
`;

export const SALES_ANALYTICS_FRAGMENT = gql`
  fragment SalesAnalyticsFields on SalesAnalytics {
    topProducts {
      productId
      product {
        id
        name
        category
      }
      quantitySold
      revenue
      growthRate
    }
    categoryBreakdown {
      category
      quantitySold
      revenue
      percentage
    }
    paymentMethods {
      card
      cash
      digital
      other
    }
  }
`;

export const ADMIN_NOTIFICATION_FRAGMENT = gql`
  fragment AdminNotificationFields on AdminNotification {
    id
    type
    severity
    title
    message
    read
    createdAt
    readAt
    actionUrl
  }
`;

export const ADMIN_SETTINGS_FRAGMENT = gql`
  fragment AdminSettingsFields on AdminSettings {
    general {
      businessName
      timezone
      currency
      taxRate
      locale
    }
    operations {
      autoAssignOrders
      orderTimeout
      maxOrdersPerCustomer
      enableQualityControl
      enableInventoryTracking
    }
    notifications {
      emailEnabled
      smsEnabled
      pushEnabled
      criticalAlertsOnly
      notificationEmail
      notificationPhone
    }
    integrations {
      paymentProviders
      inventorySystem
      accountingSystem
      deliveryProviders
    }
  }
`;

// Queries
export const GET_ADMIN_DASHBOARD = gql`
  ${ADMIN_DASHBOARD_FRAGMENT}
  query GetAdminDashboard($cafeId: ID!) {
    adminDashboard(cafeId: $cafeId) {
      ...AdminDashboardFields
      recentActivity {
        id
        type
        description
        timestamp
      }
      topProducts {
        productId
        product {
          id
          name
        }
        quantitySold
        revenue
      }
    }
  }
`;

export const GET_REVENUE_METRICS = gql`
  ${REVENUE_METRICS_FRAGMENT}
  query GetRevenueMetrics($cafeId: ID!, $dateRange: DateRangeInput) {
    revenueMetrics(cafeId: $cafeId, dateRange: $dateRange) {
      ...RevenueMetricsFields
      hourlyBreakdown {
        hour
        revenue
        orders
        averageValue
      }
      dailyBreakdown {
        date
        revenue
        orders
        averageValue
      }
    }
  }
`;

export const GET_ORDER_METRICS = gql`
  ${ORDER_METRICS_FRAGMENT}
  query GetOrderMetrics($cafeId: ID!, $dateRange: DateRangeInput) {
    orderMetrics(cafeId: $cafeId, dateRange: $dateRange) {
      ...OrderMetricsFields
    }
  }
`;

export const GET_EMPLOYEE_PERFORMANCE = gql`
  ${EMPLOYEE_PERFORMANCE_FRAGMENT}
  query GetEmployeePerformance($cafeId: ID!, $dateRange: DateRangeInput, $limit: Int) {
    employeePerformance(cafeId: $cafeId, dateRange: $dateRange, limit: $limit) {
      ...EmployeePerformanceFields
    }
  }
`;

export const GET_SALES_ANALYTICS = gql`
  ${SALES_ANALYTICS_FRAGMENT}
  query GetSalesAnalytics($cafeId: ID!, $dateRange: DateRangeInput) {
    salesAnalytics(cafeId: $cafeId, dateRange: $dateRange) {
      ...SalesAnalyticsFields
      hourlyRevenue {
        hour
        revenue
        orders
        averageValue
      }
      dailyRevenue {
        date
        revenue
        orders
        averageValue
      }
      customerSegments {
        segment
        count
        revenue
        averageValue
      }
    }
  }
`;

export const GET_ADMIN_NOTIFICATIONS = gql`
  ${ADMIN_NOTIFICATION_FRAGMENT}
  query GetAdminNotifications($cafeId: ID!, $unreadOnly: Boolean, $limit: Int) {
    adminNotifications(cafeId: $cafeId, unreadOnly: $unreadOnly, limit: $limit) {
      ...AdminNotificationFields
    }
  }
`;

export const GET_ADMIN_SETTINGS = gql`
  ${ADMIN_SETTINGS_FRAGMENT}
  query GetAdminSettings($cafeId: ID!) {
    adminSettings(cafeId: $cafeId) {
      ...AdminSettingsFields
    }
  }
`;

// Mutations
export const MARK_NOTIFICATION_READ = gql`
  ${ADMIN_NOTIFICATION_FRAGMENT}
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      ...AdminNotificationFields
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead($cafeId: ID!) {
    markAllNotificationsRead(cafeId: $cafeId)
  }
`;

export const UPDATE_ADMIN_SETTINGS = gql`
  ${ADMIN_SETTINGS_FRAGMENT}
  mutation UpdateAdminSettings($cafeId: ID!, $input: UpdateAdminSettingsInput!) {
    updateAdminSettings(cafeId: $cafeId, input: $input) {
      ...AdminSettingsFields
    }
  }
`;

// Subscriptions
export const REVENUE_UPDATED_SUBSCRIPTION = gql`
  ${REVENUE_METRICS_FRAGMENT}
  subscription RevenueUpdated($cafeId: ID!) {
    revenueUpdated(cafeId: $cafeId) {
      ...RevenueMetricsFields
    }
  }
`;

export const ORDER_METRICS_UPDATED_SUBSCRIPTION = gql`
  ${ORDER_METRICS_FRAGMENT}
  subscription OrderMetricsUpdated($cafeId: ID!) {
    orderMetricsUpdated(cafeId: $cafeId) {
      ...OrderMetricsFields
    }
  }
`;

export const ADMIN_NOTIFICATION_CREATED_SUBSCRIPTION = gql`
  ${ADMIN_NOTIFICATION_FRAGMENT}
  subscription AdminNotificationCreated($cafeId: ID!) {
    adminNotificationCreated(cafeId: $cafeId) {
      ...AdminNotificationFields
    }
  }
`;
