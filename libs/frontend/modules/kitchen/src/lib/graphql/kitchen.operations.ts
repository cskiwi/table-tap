import { gql } from 'apollo-angular';

// Fragments
export const KITCHEN_ORDER_FRAGMENT = gql`
  fragment KitchenOrderFields on KitchenOrder {
    id
    orderNumber
    status
    customerName
    orderType
    tableNumber
    createdAt
    confirmedAt
    preparingAt
    readyAt
    estimatedPrepTime
    specialInstructions
    notes
    priority
    items {
      id
      productId
      product {
        id
        name
        category
        preparationTime
        attributes
      }
      quantity
      unitPrice
      customizations
      specialInstructions
      allergiesNotes
      preparationStatus
      preparationStartTime
      preparationEndTime
    }
    assignedStaff {
      id
      employee {
        id
        firstName
        lastName
        position
      }
      currentStation
      status
    }
    counter {
      id
      name
      type
      status
    }
    workflowSteps {
      id
      stepName
      status
      assignedCounterId
      startedAt
      completedAt
      estimatedDuration
    }
  }
`;

export const KITCHEN_METRICS_FRAGMENT = gql`
  fragment KitchenMetricsFields on KitchenMetrics {
    totalOrdersToday
    averagePrepTime
    onTimeCompletionRate
    peakHourOrders
    averageWaitTime
    ordersByPriority {
      normal
      high
      urgent
      rush
    }
    ordersByStatus {
      pending
      confirmed
      preparing
      ready
      completed
      cancelled
    }
    preparationEfficiency
    staffUtilization
    equipmentUtilization
  }
`;

export const KITCHEN_ALERT_FRAGMENT = gql`
  fragment KitchenAlertFields on KitchenAlert {
    id
    type
    severity
    title
    message
    orderId
    equipmentId
    createdAt
    resolvedAt
    dismissedAt
    resolved
  }
`;

export const KITCHEN_TIMER_FRAGMENT = gql`
  fragment KitchenTimerFields on KitchenTimer {
    id
    type
    name
    duration
    remainingTime
    status
    priority
    orderId
    orderItemId
    equipmentId
    createdAt
    startedAt
    pausedAt
    completedAt
    notes
  }
`;

// Queries
export const GET_KITCHEN_DASHBOARD = gql`
  ${KITCHEN_ORDER_FRAGMENT}
  query GetKitchenDashboard($cafeId: ID!) {
    kitchenDashboard(cafeId: $cafeId) {
      totalOrders
      pendingOrders
      inProgressOrders
      completedOrders
      averagePrepTime
      activeTimers
      criticalAlerts
      activeStaff
      recentOrders {
        ...KitchenOrderFields
      }
    }
  }
`;

export const GET_KITCHEN_ORDERS = gql`
  ${KITCHEN_ORDER_FRAGMENT}
  query GetKitchenOrders(
    $cafeId: ID!
    $status: [OrderStatus!]
    $priority: [OrderPriority!]
    $counter: ID
    $dateRange: DateRangeInput
  ) {
    kitchenOrders(
      cafeId: $cafeId
      status: $status
      priority: $priority
      counter: $counter
      dateRange: $dateRange
    ) {
      ...KitchenOrderFields
    }
  }
`;

export const GET_KITCHEN_ORDER = gql`
  ${KITCHEN_ORDER_FRAGMENT}
  query GetKitchenOrder($id: ID!) {
    kitchenOrder(id: $id) {
      ...KitchenOrderFields
    }
  }
`;

export const GET_KITCHEN_METRICS = gql`
  ${KITCHEN_METRICS_FRAGMENT}
  query GetKitchenMetrics($cafeId: ID!, $dateRange: DateRangeInput) {
    kitchenMetrics(cafeId: $cafeId, dateRange: $dateRange) {
      ...KitchenMetricsFields
    }
  }
`;

export const GET_KITCHEN_ALERTS = gql`
  ${KITCHEN_ALERT_FRAGMENT}
  query GetKitchenAlerts(
    $cafeId: ID!
    $severity: [AlertSeverity!]
    $type: [AlertType!]
    $resolved: Boolean
  ) {
    kitchenAlerts(
      cafeId: $cafeId
      severity: $severity
      type: $type
      resolved: $resolved
    ) {
      ...KitchenAlertFields
    }
  }
`;

export const GET_KITCHEN_TIMERS = gql`
  ${KITCHEN_TIMER_FRAGMENT}
  query GetKitchenTimers(
    $cafeId: ID!
    $status: [TimerStatus!]
    $type: [TimerType!]
  ) {
    kitchenTimers(cafeId: $cafeId, status: $status, type: $type) {
      ...KitchenTimerFields
    }
  }
`;

export const GET_KITCHEN_STATIONS = gql`
  query GetKitchenStations($cafeId: ID!) {
    kitchenStations(cafeId: $cafeId) {
      id
      name
      type
      status
      capacity
      currentLoad
      assignedStaff {
        id
        employee {
          id
          firstName
          lastName
        }
        status
      }
    }
  }
`;

export const GET_KITCHEN_STAFF = gql`
  query GetKitchenStaff($cafeId: ID!, $status: [StaffStatus!], $station: StationType) {
    kitchenStaff(cafeId: $cafeId, status: $status, station: $station) {
      id
      employee {
        id
        firstName
        lastName
        position
      }
      currentStation
      status
      assignedAt
      performance {
        ordersCompleted
        averagePrepTime
        accuracyRate
        efficiency
      }
    }
  }
`;

// Mutations
export const UPDATE_KITCHEN_ORDER_STATUS = gql`
  ${KITCHEN_ORDER_FRAGMENT}
  mutation UpdateKitchenOrderStatus($id: ID!, $status: OrderStatus!) {
    updateKitchenOrderStatus(id: $id, status: $status) {
      ...KitchenOrderFields
    }
  }
`;

export const UPDATE_ORDER_ITEM_STATUS = gql`
  mutation UpdateOrderItemStatus($id: ID!, $status: PreparationStatus!) {
    updateOrderItemStatus(id: $id, status: $status) {
      id
      preparationStatus
      preparationStartTime
      preparationEndTime
    }
  }
`;

export const ASSIGN_ORDER_TO_STAFF = gql`
  ${KITCHEN_ORDER_FRAGMENT}
  mutation AssignOrderToStaff($orderId: ID!, $staffId: ID!) {
    assignOrderToStaff(orderId: $orderId, staffId: $staffId) {
      ...KitchenOrderFields
    }
  }
`;

export const CREATE_KITCHEN_TIMER = gql`
  ${KITCHEN_TIMER_FRAGMENT}
  mutation CreateKitchenTimer($input: CreateKitchenTimerInput!) {
    createKitchenTimer(input: $input) {
      ...KitchenTimerFields
    }
  }
`;

export const START_KITCHEN_TIMER = gql`
  ${KITCHEN_TIMER_FRAGMENT}
  mutation StartKitchenTimer($id: ID!) {
    startKitchenTimer(id: $id) {
      ...KitchenTimerFields
    }
  }
`;

export const PAUSE_KITCHEN_TIMER = gql`
  ${KITCHEN_TIMER_FRAGMENT}
  mutation PauseKitchenTimer($id: ID!) {
    pauseKitchenTimer(id: $id) {
      ...KitchenTimerFields
    }
  }
`;

export const STOP_KITCHEN_TIMER = gql`
  ${KITCHEN_TIMER_FRAGMENT}
  mutation StopKitchenTimer($id: ID!) {
    stopKitchenTimer(id: $id) {
      ...KitchenTimerFields
    }
  }
`;

export const DELETE_KITCHEN_TIMER = gql`
  mutation DeleteKitchenTimer($id: ID!) {
    deleteKitchenTimer(id: $id)
  }
`;

export const RESOLVE_KITCHEN_ALERT = gql`
  ${KITCHEN_ALERT_FRAGMENT}
  mutation ResolveKitchenAlert($id: ID!) {
    resolveKitchenAlert(id: $id) {
      ...KitchenAlertFields
    }
  }
`;

export const DISMISS_KITCHEN_ALERT = gql`
  ${KITCHEN_ALERT_FRAGMENT}
  mutation DismissKitchenAlert($id: ID!) {
    dismissKitchenAlert(id: $id) {
      ...KitchenAlertFields
    }
  }
`;

export const CREATE_QUALITY_CHECK = gql`
  mutation CreateQualityCheck($input: CreateQualityCheckInput!) {
    createQualityCheck(input: $input) {
      id
      orderId
      orderItemId
      checkpoints {
        name
        passed
        notes
      }
      performedAt
    }
  }
`;

export const SUBMIT_QUALITY_CHECK = gql`
  mutation SubmitQualityCheck($id: ID!, $input: QualityCheckResultInput!) {
    submitQualityCheck(id: $id, input: $input) {
      id
      overallScore
      passed
      checkpoints {
        name
        passed
        notes
      }
      performedAt
    }
  }
`;

export const APPLY_WORKFLOW_TEMPLATE = gql`
  ${KITCHEN_ORDER_FRAGMENT}
  mutation ApplyWorkflowTemplate($orderId: ID!, $templateId: ID!) {
    applyWorkflowTemplate(orderId: $orderId, templateId: $templateId) {
      ...KitchenOrderFields
    }
  }
`;

// Subscriptions
export const KITCHEN_ORDER_UPDATED_SUBSCRIPTION = gql`
  ${KITCHEN_ORDER_FRAGMENT}
  subscription KitchenOrderUpdated($cafeId: ID!) {
    kitchenOrderUpdated(cafeId: $cafeId) {
      ...KitchenOrderFields
    }
  }
`;

export const KITCHEN_ORDER_CREATED_SUBSCRIPTION = gql`
  ${KITCHEN_ORDER_FRAGMENT}
  subscription KitchenOrderCreated($cafeId: ID!) {
    kitchenOrderCreated(cafeId: $cafeId) {
      ...KitchenOrderFields
    }
  }
`;

export const KITCHEN_TIMER_EXPIRED_SUBSCRIPTION = gql`
  ${KITCHEN_TIMER_FRAGMENT}
  subscription KitchenTimerExpired($cafeId: ID!) {
    kitchenTimerExpired(cafeId: $cafeId) {
      ...KitchenTimerFields
    }
  }
`;

export const KITCHEN_ALERT_CREATED_SUBSCRIPTION = gql`
  ${KITCHEN_ALERT_FRAGMENT}
  subscription KitchenAlertCreated($cafeId: ID!, $severity: AlertSeverity) {
    kitchenAlertCreated(cafeId: $cafeId, severity: $severity) {
      ...KitchenAlertFields
    }
  }
`;
