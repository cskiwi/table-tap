import { gql } from 'apollo-angular';

// Order fragment for reuse
const ORDER_FIELDS = gql`
  fragment OrderFields on Order {
    id
    restaurantId
    trackingNumber
    status
    customerInfo {
      firstName
      lastName
      email
      phone
      tableNumber
      specialRequests
    }
    items {
      id
      menuItemId
      name
      price
      quantity
      customizations {
        id
        name
        price
        category
      }
      specialInstructions
    }
    summary {
      subtotal
      tax
      tip
      discount
      total
      estimatedTime
    }
    paymentMethod {
      id
      type
      name
      last4
    }
    timestamps {
      created
      confirmed
      preparationStarted
      ready
      delivered
      cancelled
    }
    notes
  }
`;

// Dynamic query using OrderArgs
export const GET_ORDERS = gql`
  ${ORDER_FIELDS}
  query GetOrders($args: OrderArgs) {
    orders(args: $args) {
      ...OrderFields
    }
  }
`;

// Single order query
export const GET_ORDER = gql`
  ${ORDER_FIELDS}
  query GetOrder($id: String!) {
    order(id: $id) {
      ...OrderFields
    }
  }
`;

// Legacy query name for backwards compatibility
export const GET_ORDER_BY_ID = GET_ORDER;

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      trackingNumber
      status
      estimatedTime
      total
      error {
        code
        message
        field
        retryable
      }
    }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      id
      status
      timestamps {
        confirmed
        preparationStarted
        ready
        delivered
        cancelled
      }
    }
  }
`;

export const PROCESS_PAYMENT = gql`
  mutation ProcessPayment($input: ProcessPaymentInput!) {
    processPayment(input: $input) {
      success
      transactionId
      error {
        code
        message
        field
        retryable
      }
      requiresAdditionalAuth
      authUrl
    }
  }
`;


export const GET_ORDER_STATUS = gql`
  query GetOrderStatus($id: ID!) {
    orderStatus(id: $id) {
      status
      estimatedTime
      timestamps {
        confirmed
        preparationStarted
        ready
        delivered
      }
    }
  }
`;

export const ORDER_STATUS_SUBSCRIPTION = gql`
  subscription OrderStatusUpdate($orderId: ID!) {
    orderStatusUpdate(orderId: $orderId) {
      orderId
      status
      timestamp
      message
      estimatedTime
    }
  }
`;

export const VALIDATE_ORDER = gql`
  mutation ValidateOrder($input: ValidateOrderInput!) {
    validateOrder(input: $input) {
      valid
      errors {
        code
        message
        field
      }
      warnings {
        code
        message
      }
      updatedPricing {
        subtotal
        tax
        total
      }
    }
  }
`;

export const GET_PAYMENT_METHODS = gql`
  query GetPaymentMethods($customerId: ID!) {
    paymentMethods(customerId: $customerId) {
      id
      type
      name
      last4
      expiryMonth
      expiryYear
      isDefault
    }
  }
`;

export const CANCEL_ORDER = gql`
  mutation CancelOrder($orderId: ID!, $reason: String) {
    cancelOrder(orderId: $orderId, reason: $reason) {
      id
      status
      refundAmount
      refundStatus
    }
  }
`;