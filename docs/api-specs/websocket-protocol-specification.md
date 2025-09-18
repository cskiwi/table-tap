# WebSocket Protocol Specification

## Overview

This document defines the WebSocket protocol for real-time communication in the Restaurant Ordering System. The protocol enables live order updates, status notifications, counter management, and employee coordination.

## Connection Configuration

### Base URL
- **Production**: `wss://ws.table-tap.com/v1`
- **Development**: `ws://localhost:3001/v1`

### Authentication
- **Method**: JWT token via connection query parameter or Authorization header
- **Format**: `?token={jwt_token}` or `Authorization: Bearer {jwt_token}`
- **Validation**: Token validated on connection and renewed every 30 minutes

### Connection Limits
- **Per User**: 5 concurrent connections
- **Per Cafe**: 1000 concurrent connections
- **Global**: 10,000 concurrent connections

## Connection Lifecycle

### 1. Connection Establishment

```typescript
// Client connection
const socket = new WebSocket('wss://ws.table-tap.com/v1?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// Server response on successful connection
{
  "type": "connection_established",
  "data": {
    "connectionId": "conn_123456789",
    "userId": "user_uuid",
    "userType": "customer|employee",
    "cafeId": "cafe_uuid",
    "capabilities": ["order_updates", "status_notifications"],
    "serverTime": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Channel Subscription

```typescript
// Subscribe to specific channels
{
  "type": "subscribe",
  "data": {
    "channels": [
      "orders:customer:{customerId}",
      "cafe:{cafeId}:general",
      "counter:{counterId}:orders"
    ]
  }
}

// Server subscription confirmation
{
  "type": "subscription_confirmed",
  "data": {
    "channels": [
      "orders:customer:{customerId}",
      "cafe:{cafeId}:general"
    ],
    "failed": [
      {
        "channel": "counter:{counterId}:orders",
        "reason": "insufficient_permissions"
      }
    ]
  }
}
```

### 3. Heartbeat & Keep-Alive

```typescript
// Client ping (every 30 seconds)
{
  "type": "ping",
  "timestamp": "2024-01-15T10:30:00Z"
}

// Server pong response
{
  "type": "pong",
  "timestamp": "2024-01-15T10:30:00Z",
  "serverTime": "2024-01-15T10:30:01Z"
}
```

## Message Protocol

### Base Message Structure

```typescript
interface WebSocketMessage {
  type: string;                    // Message type identifier
  data: any;                      // Message payload
  timestamp: string;              // ISO 8601 timestamp
  messageId?: string;             // Unique message identifier
  correlationId?: string;         // Request correlation ID
  channel?: string;               // Target channel
  version?: string;               // Protocol version (default: "1.0")
}
```

### Message Types

## Customer-Facing Messages

### Order Status Updates

```typescript
// Order created
{
  "type": "order_created",
  "data": {
    "orderId": "order_uuid",
    "orderNumber": "ORD-001234",
    "status": "pending",
    "items": [...],
    "total": 15.50,
    "estimatedTime": 12,
    "paymentRequired": true
  },
  "channel": "orders:customer:{customerId}",
  "timestamp": "2024-01-15T10:30:00Z"
}

// Order status changed
{
  "type": "order_status_changed",
  "data": {
    "orderId": "order_uuid",
    "previousStatus": "pending",
    "currentStatus": "confirmed",
    "updatedBy": "employee_uuid",
    "estimatedTime": 10,
    "message": "Your order is being prepared"
  },
  "channel": "orders:customer:{customerId}",
  "timestamp": "2024-01-15T10:30:00Z"
}

// Order ready for pickup
{
  "type": "order_ready",
  "data": {
    "orderId": "order_uuid",
    "orderNumber": "ORD-001234",
    "pickupLocation": "Counter 2",
    "pickupCode": "1234",
    "expiresAt": "2024-01-15T11:00:00Z"
  },
  "channel": "orders:customer:{customerId}",
  "timestamp": "2024-01-15T10:45:00Z"
}

// Order completed
{
  "type": "order_completed",
  "data": {
    "orderId": "order_uuid",
    "completedAt": "2024-01-15T10:45:00Z",
    "rating": {
      "enabled": true,
      "url": "https://app.table-tap.com/rate/order_uuid"
    }
  },
  "channel": "orders:customer:{customerId}",
  "timestamp": "2024-01-15T10:45:00Z"
}
```

### Payment Updates

```typescript
// Payment processed
{
  "type": "payment_processed",
  "data": {
    "orderId": "order_uuid",
    "transactionId": "txn_123456",
    "amount": 15.50,
    "method": "card",
    "status": "success",
    "receiptUrl": "https://api.table-tap.com/receipts/txn_123456"
  },
  "channel": "orders:customer:{customerId}",
  "timestamp": "2024-01-15T10:30:30Z"
}

// Payment failed
{
  "type": "payment_failed",
  "data": {
    "orderId": "order_uuid",
    "reason": "insufficient_funds",
    "message": "Payment was declined. Please try a different payment method.",
    "retryUrl": "https://app.table-tap.com/payment/order_uuid",
    "expiresAt": "2024-01-15T10:45:00Z"
  },
  "channel": "orders:customer:{customerId}",
  "timestamp": "2024-01-15T10:30:30Z"
}
```

## Staff-Facing Messages

### Counter Orders

```typescript
// New order assigned to counter
{
  "type": "order_assigned",
  "data": {
    "orderId": "order_uuid",
    "orderNumber": "ORD-001234",
    "items": [
      {
        "name": "Cappuccino",
        "quantity": 2,
        "customizations": ["Extra shot", "Oat milk"],
        "priority": "high"
      }
    ],
    "orderType": "takeaway",
    "customerName": "John D.",
    "specialInstructions": "Extra hot",
    "estimatedTime": 8,
    "assignedAt": "2024-01-15T10:30:00Z"
  },
  "channel": "counter:{counterId}:orders",
  "timestamp": "2024-01-15T10:30:00Z"
}

// Order priority changed
{
  "type": "order_priority_changed",
  "data": {
    "orderId": "order_uuid",
    "previousPriority": "normal",
    "currentPriority": "high",
    "reason": "customer_waiting",
    "updatedBy": "manager_uuid"
  },
  "channel": "counter:{counterId}:orders",
  "timestamp": "2024-01-15T10:32:00Z"
}

// Order cancelled
{
  "type": "order_cancelled",
  "data": {
    "orderId": "order_uuid",
    "reason": "item_unavailable",
    "message": "Espresso machine out of order",
    "cancelledBy": "employee_uuid",
    "refundRequired": true,
    "refundAmount": 15.50
  },
  "channel": "counter:{counterId}:orders",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

### Staff Coordination

```typescript
// Employee clock in/out
{
  "type": "employee_status_changed",
  "data": {
    "employeeId": "employee_uuid",
    "name": "Jane Smith",
    "status": "clocked_in",
    "location": "Counter 1",
    "shift": {
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T17:00:00Z"
    }
  },
  "channel": "cafe:{cafeId}:staff",
  "timestamp": "2024-01-15T09:00:00Z"
}

// Break notifications
{
  "type": "break_started",
  "data": {
    "employeeId": "employee_uuid",
    "name": "Jane Smith",
    "breakType": "lunch",
    "duration": 30,
    "coveringEmployees": ["employee_uuid_2"],
    "returnTime": "2024-01-15T13:30:00Z"
  },
  "channel": "cafe:{cafeId}:staff",
  "timestamp": "2024-01-15T13:00:00Z"
}

// Counter status changes
{
  "type": "counter_status_changed",
  "data": {
    "counterId": "counter_uuid",
    "name": "Espresso Bar",
    "previousStatus": "active",
    "currentStatus": "maintenance",
    "reason": "Equipment cleaning",
    "estimatedDowntime": 20,
    "affectedOrders": ["order_uuid_1", "order_uuid_2"],
    "updatedBy": "manager_uuid"
  },
  "channel": "cafe:{cafeId}:general",
  "timestamp": "2024-01-15T14:00:00Z"
}
```

## Manager Dashboard Messages

### Real-time Analytics

```typescript
// Live metrics update
{
  "type": "metrics_update",
  "data": {
    "period": "current_hour",
    "metrics": {
      "ordersReceived": 45,
      "ordersCompleted": 42,
      "averageWaitTime": 8.5,
      "revenue": 687.50,
      "topItems": [
        { "name": "Cappuccino", "count": 15 },
        { "name": "Americano", "count": 12 }
      ]
    },
    "counters": [
      {
        "counterId": "counter_uuid",
        "name": "Espresso Bar",
        "queueLength": 3,
        "averageTime": 6.2,
        "status": "active"
      }
    ]
  },
  "channel": "cafe:{cafeId}:metrics",
  "timestamp": "2024-01-15T10:30:00Z"
}

// Alert notifications
{
  "type": "alert",
  "data": {
    "severity": "warning",
    "category": "queue_length",
    "message": "Counter 1 queue exceeding 10 minutes average wait time",
    "counterId": "counter_uuid",
    "currentWaitTime": 12.5,
    "threshold": 10,
    "suggestedActions": [
      "Assign additional staff",
      "Activate backup counter",
      "Notify customers of delay"
    ]
  },
  "channel": "cafe:{cafeId}:alerts",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Handling

### Connection Errors

```typescript
// Authentication error
{
  "type": "error",
  "data": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid or expired token",
    "action": "reconnect_with_new_token"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}

// Permission error
{
  "type": "error",
  "data": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Access denied to channel: counter:123:orders",
    "channel": "counter:123:orders",
    "requiredRole": "staff"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}

// Rate limit exceeded
{
  "type": "error",
  "data": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many messages sent",
    "retryAfter": 60,
    "limit": 100,
    "window": 60
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Message Delivery Acknowledgment

```typescript
// Client sends message with ID
{
  "type": "order_status_update",
  "messageId": "msg_123456",
  "data": {
    "orderId": "order_uuid",
    "status": "preparing"
  }
}

// Server acknowledges receipt
{
  "type": "message_acknowledged",
  "data": {
    "messageId": "msg_123456",
    "status": "processed",
    "processedAt": "2024-01-15T10:30:01Z"
  }
}

// Server indicates processing error
{
  "type": "message_error",
  "data": {
    "messageId": "msg_123456",
    "error": {
      "code": "INVALID_ORDER_STATUS",
      "message": "Cannot transition from 'completed' to 'preparing'"
    }
  }
}
```

## Channel Subscription Model

### Channel Naming Convention

```
orders:customer:{customerId}          // Customer's personal orders
orders:employee:{employeeId}          // Employee's assigned orders
counter:{counterId}:orders           // Orders for specific counter
counter:{counterId}:status           // Counter status updates
cafe:{cafeId}:general               // General cafe announcements
cafe:{cafeId}:staff                 // Staff coordination
cafe:{cafeId}:metrics               // Real-time analytics
cafe:{cafeId}:alerts                // System alerts
system:maintenance                   // System-wide maintenance
```

### Permission Matrix

| User Type | Allowed Channels |
|-----------|------------------|
| Customer | `orders:customer:{own_id}`, `cafe:{cafeId}:general` |
| Employee | `orders:employee:{own_id}`, `counter:{assigned_counters}:*`, `cafe:{cafeId}:staff` |
| Manager | `cafe:{cafeId}:*`, `counter:*:*` |
| Admin | `*` (all channels) |

## Connection Recovery

### Reconnection Strategy

```typescript
// Client reconnection with last known message ID
{
  "type": "reconnect",
  "data": {
    "lastMessageId": "msg_123456",
    "channels": ["orders:customer:user_123"]
  }
}

// Server sends missed messages
{
  "type": "message_replay",
  "data": {
    "messages": [...],
    "fromMessageId": "msg_123456",
    "toMessageId": "msg_123499",
    "hasMore": false
  }
}
```

### Message Ordering

- Messages include sequence numbers within channels
- Clients can request replay of missed messages
- Server maintains 24-hour message history for replay
- Critical messages (payment, order status) have delivery confirmation

## Performance Specifications

### Message Delivery SLA

- **Local delivery**: < 50ms (same data center)
- **Cross-region delivery**: < 200ms
- **Message throughput**: 10,000 messages/second per server
- **Connection capacity**: 10,000 concurrent connections per server

### Monitoring Metrics

- Connection count by user type
- Message delivery latency (p50, p95, p99)
- Failed message delivery rate
- Channel subscription/unsubscription rate
- Bandwidth utilization per connection

## Security Considerations

### Message Encryption
- All WebSocket traffic encrypted with TLS 1.3
- Sensitive data (payment info) double-encrypted at application layer
- Message signing for critical operations

### Rate Limiting
- 100 messages per minute per connection
- 1000 channel subscriptions per connection
- 10 connections per authenticated user

### Access Control
- JWT token validation on every message
- Channel-level permissions enforced
- Audit logging for all staff actions

This WebSocket protocol ensures reliable, real-time communication while maintaining security and performance standards for the restaurant ordering system.