# WebSocket Event Structure

## Connection Architecture

### Socket.IO Implementation
```javascript
// Server-side namespace structure
/orders       // Order-related events
/inventory    // Inventory updates
/employees    // Employee/timesheet events
/payments     // Payment status updates
/system       // System notifications
```

### Client Connection
```javascript
import { io } from 'socket.io-client';

// Connect with authentication and cafe context
const socket = io('/orders', {
  auth: {
    token: localStorage.getItem('access_token')
  },
  query: {
    cafe_id: getCurrentCafeId(),
    user_role: getUserRole()
  }
});

// Connection handling
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.log('Connection error:', error);
});
```

## Event Categories & Structure

### 1. Order Events (/orders namespace)

#### order:created
Fired when a new order is placed
```json
{
  "event": "order:created",
  "data": {
    "order": {
      "id": "uuid",
      "order_number": "ORD20240101001",
      "cafe_id": "uuid",
      "customer_name": "John Doe",
      "customer_phone": "+1234567890",
      "status": "pending",
      "assigned_counter": "Counter 1",
      "items": [
        {
          "id": "uuid",
          "product_name": "Latte",
          "quantity": 2,
          "unit_price": 5.50,
          "total_price": 11.00,
          "customizations": ["Extra shot", "Oat milk"]
        }
      ],
      "totals": {
        "subtotal": 11.00,
        "tax_amount": 1.10,
        "tip_amount": 2.00,
        "total_amount": 14.10
      },
      "estimated_ready_at": "2024-01-01T00:15:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "created_by": {
        "id": "uuid",
        "name": "Jane Employee",
        "role": "employee"
      },
      "proxy_order_info": {
        "is_proxy": true,
        "ordered_for": {
          "id": "uuid",
          "name": "Bob Employee"
        }
      }
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### order:status_changed
Fired when order status is updated
```json
{
  "event": "order:status_changed",
  "data": {
    "order_id": "uuid",
    "order_number": "ORD20240101001",
    "previous_status": "pending",
    "new_status": "preparing",
    "updated_by": {
      "id": "uuid",
      "name": "Chef Mike",
      "role": "employee"
    },
    "estimated_ready_at": "2024-01-01T00:12:00Z",
    "notes": "Started preparation",
    "status_history": [
      {
        "status": "pending",
        "timestamp": "2024-01-01T00:00:00Z",
        "user_id": "uuid",
        "notes": "Order created"
      },
      {
        "status": "preparing",
        "timestamp": "2024-01-01T00:05:00Z",
        "user_id": "uuid",
        "notes": "Started preparation"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:05:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### order:ready
Fired when order is ready for pickup
```json
{
  "event": "order:ready",
  "data": {
    "order_id": "uuid",
    "order_number": "ORD20240101001",
    "customer_name": "John Doe",
    "customer_phone": "+1234567890",
    "assigned_counter": "Counter 1",
    "ready_at": "2024-01-01T00:15:00Z",
    "prep_time_minutes": 15,
    "notification_sent": true
  },
  "meta": {
    "timestamp": "2024-01-01T00:15:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### order:cancelled
Fired when order is cancelled
```json
{
  "event": "order:cancelled",
  "data": {
    "order_id": "uuid",
    "order_number": "ORD20240101001",
    "cancelled_by": {
      "id": "uuid",
      "name": "Manager Sarah",
      "role": "manager"
    },
    "reason": "Customer requested cancellation",
    "refund_info": {
      "refund_amount": 14.10,
      "refund_method": "original_payment",
      "processed": true
    },
    "cancelled_at": "2024-01-01T00:08:00Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:08:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### order:assigned_counter
Fired when order is assigned to a different counter
```json
{
  "event": "order:assigned_counter",
  "data": {
    "order_id": "uuid",
    "order_number": "ORD20240101001",
    "previous_counter": "Counter 1",
    "new_counter": "Counter 2",
    "assigned_by": {
      "id": "uuid",
      "name": "Manager Sarah"
    },
    "reason": "Load balancing"
  },
  "meta": {
    "timestamp": "2024-01-01T00:02:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

### 2. Payment Events (/payments namespace)

#### payment:processing
Fired when payment processing starts
```json
{
  "event": "payment:processing",
  "data": {
    "order_id": "uuid",
    "transaction_id": "txn_uuid",
    "payment_method": "card",
    "amount": 14.10,
    "provider": "payconic",
    "status": "processing"
  },
  "meta": {
    "timestamp": "2024-01-01T00:01:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### payment:completed
Fired when payment is successfully completed
```json
{
  "event": "payment:completed",
  "data": {
    "order_id": "uuid",
    "transaction_id": "txn_uuid",
    "payment_method": "card",
    "amount": 14.10,
    "fee_amount": 0.45,
    "net_amount": 13.65,
    "provider": "payconic",
    "provider_transaction_id": "prov_txn_123",
    "completed_at": "2024-01-01T00:02:00Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:02:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### payment:failed
Fired when payment fails
```json
{
  "event": "payment:failed",
  "data": {
    "order_id": "uuid",
    "transaction_id": "txn_uuid",
    "payment_method": "card",
    "amount": 14.10,
    "provider": "payconic",
    "error_code": "insufficient_funds",
    "error_message": "Card declined due to insufficient funds",
    "retry_allowed": true
  },
  "meta": {
    "timestamp": "2024-01-01T00:02:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### qr:generated
Fired when QR payment code is generated
```json
{
  "event": "qr:generated",
  "data": {
    "order_id": "uuid",
    "qr_code_id": "qr_uuid",
    "qr_code_data": "payment://tabletap.com/pay?id=uuid&amount=14.10",
    "amount": 14.10,
    "expires_at": "2024-01-01T00:05:00Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

### 3. Inventory Events (/inventory namespace)

#### inventory:stock_updated
Fired when stock levels change
```json
{
  "event": "inventory:stock_updated",
  "data": {
    "product_id": "uuid",
    "product_name": "Espresso Beans",
    "sku": "ESP001",
    "previous_stock": 25,
    "new_stock": 20,
    "change_amount": -5,
    "change_type": "sale", // sale, purchase, adjustment, waste
    "updated_by": {
      "id": "uuid",
      "name": "System",
      "type": "automatic"
    },
    "reference": {
      "type": "order",
      "id": "uuid"
    },
    "reorder_needed": false
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### inventory:low_stock
Fired when stock falls below reorder level
```json
{
  "event": "inventory:low_stock",
  "data": {
    "product_id": "uuid",
    "product_name": "Espresso Beans",
    "sku": "ESP001",
    "current_stock": 8,
    "reorder_level": 10,
    "max_stock": 100,
    "suggested_order_quantity": 50,
    "last_restocked": "2024-01-01T00:00:00Z",
    "priority": "medium" // low, medium, high, critical
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### inventory:out_of_stock
Fired when product goes out of stock
```json
{
  "event": "inventory:out_of_stock",
  "data": {
    "product_id": "uuid",
    "product_name": "Oat Milk",
    "sku": "MILK002",
    "auto_disabled": true,
    "affects_products": [
      {
        "product_id": "uuid",
        "product_name": "Oat Milk Latte",
        "disabled": true
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

### 4. Employee Events (/employees namespace)

#### employee:clocked_in
Fired when employee clocks in
```json
{
  "event": "employee:clocked_in",
  "data": {
    "user_id": "uuid",
    "employee_id": "EMP001",
    "employee_name": "John Doe",
    "timesheet_id": "uuid",
    "clock_in_time": "2024-01-01T08:00:00Z",
    "shift_date": "2024-01-01",
    "notes": "Started morning shift"
  },
  "meta": {
    "timestamp": "2024-01-01T08:00:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### employee:clocked_out
Fired when employee clocks out
```json
{
  "event": "employee:clocked_out",
  "data": {
    "user_id": "uuid",
    "employee_id": "EMP001",
    "employee_name": "John Doe",
    "timesheet_id": "uuid",
    "clock_out_time": "2024-01-01T17:00:00Z",
    "total_hours": 8.5,
    "hourly_rate": 15.00,
    "total_pay": 127.50,
    "break_duration_minutes": 30
  },
  "meta": {
    "timestamp": "2024-01-01T17:00:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### employee:drink_consumed
Fired when employee drink is tracked
```json
{
  "event": "employee:drink_consumed",
  "data": {
    "user_id": "uuid",
    "employee_name": "John Doe",
    "product_name": "Latte",
    "quantity": 1,
    "order_id": "uuid", // if from order
    "counted_against_allowance": true,
    "monthly_count": 8,
    "monthly_limit": 20,
    "remaining_allowance": 12
  },
  "meta": {
    "timestamp": "2024-01-01T10:30:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

### 5. System Events (/system namespace)

#### counter:status_changed
Fired when counter is activated/deactivated
```json
{
  "event": "counter:status_changed",
  "data": {
    "counter_name": "Counter 1",
    "previous_status": "active",
    "new_status": "inactive",
    "changed_by": {
      "id": "uuid",
      "name": "Manager Sarah"
    },
    "reason": "Equipment maintenance",
    "active_orders_count": 3,
    "orders_reassigned_to": "Counter 2"
  },
  "meta": {
    "timestamp": "2024-01-01T14:00:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

#### cafe:settings_updated
Fired when cafe settings are changed
```json
{
  "event": "cafe:settings_updated",
  "data": {
    "updated_by": {
      "id": "uuid",
      "name": "Admin User"
    },
    "changes": {
      "tip_suggestions": {
        "previous": [0.10, 0.15, 0.20],
        "new": [0.12, 0.15, 0.18, 0.22]
      },
      "prep_time_minutes": {
        "previous": 15,
        "new": 12
      }
    }
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "cafe_id": "uuid",
    "event_id": "evt_uuid"
  }
}
```

## Room Management & Targeting

### Room Structure
```javascript
// Server-side room management
socket.join(`cafe:${cafe_id}`);                    // All cafe events
socket.join(`cafe:${cafe_id}:orders`);            // Order events only
socket.join(`cafe:${cafe_id}:counter:${counter}`); // Specific counter
socket.join(`cafe:${cafe_id}:role:${role}`);       // Role-specific events
socket.join(`user:${user_id}`);                    // User-specific events
```

### Event Targeting
```javascript
// Broadcast to all users in cafe
io.to(`cafe:${cafe_id}`).emit('order:created', orderData);

// Broadcast to specific counter
io.to(`cafe:${cafe_id}:counter:Counter1`).emit('order:assigned_counter', data);

// Broadcast to managers only
io.to(`cafe:${cafe_id}:role:manager`).emit('inventory:low_stock', data);

// Send to specific user
io.to(`user:${user_id}`).emit('employee:clocked_in', data);
```

## Client Event Handlers

### Angular Service Example
```typescript
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket;
  private ordersSubject = new BehaviorSubject<any[]>([]);
  private inventoryAlertsSubject = new BehaviorSubject<any[]>([]);

  constructor() {
    this.initConnection();
  }

  private initConnection() {
    this.socket = io('/orders', {
      auth: {
        token: this.getAuthToken()
      },
      query: {
        cafe_id: this.getCurrentCafeId()
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Order events
    this.socket.on('order:created', (data) => {
      console.log('New order received:', data);
      this.handleNewOrder(data.data.order);
    });

    this.socket.on('order:status_changed', (data) => {
      console.log('Order status changed:', data);
      this.handleOrderStatusChange(data.data);
    });

    this.socket.on('order:ready', (data) => {
      console.log('Order ready:', data);
      this.showNotification(`Order ${data.data.order_number} is ready!`);
    });

    // Inventory events
    this.socket.on('inventory:low_stock', (data) => {
      console.log('Low stock alert:', data);
      this.handleLowStockAlert(data.data);
    });

    // Employee events
    this.socket.on('employee:clocked_in', (data) => {
      console.log('Employee clocked in:', data);
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
    });
  }

  // Public methods for components to subscribe to events
  getOrders(): Observable<any[]> {
    return this.ordersSubject.asObservable();
  }

  getInventoryAlerts(): Observable<any[]> {
    return this.inventoryAlertsSubject.asObservable();
  }

  // Send events to server
  updateOrderStatus(orderId: string, status: string, notes?: string) {
    this.socket.emit('update_order_status', {
      order_id: orderId,
      status: status,
      notes: notes
    });
  }

  joinCounterRoom(counter: string) {
    this.socket.emit('join_counter', { counter });
  }

  leaveCounterRoom(counter: string) {
    this.socket.emit('leave_counter', { counter });
  }

  private handleNewOrder(order: any) {
    const currentOrders = this.ordersSubject.value;
    this.ordersSubject.next([order, ...currentOrders]);
  }

  private handleOrderStatusChange(data: any) {
    const currentOrders = this.ordersSubject.value;
    const updatedOrders = currentOrders.map(order =>
      order.id === data.order_id
        ? { ...order, status: data.new_status }
        : order
    );
    this.ordersSubject.next(updatedOrders);
  }

  private handleLowStockAlert(data: any) {
    const currentAlerts = this.inventoryAlertsSubject.value;
    this.inventoryAlertsSubject.next([data, ...currentAlerts]);
  }

  private showNotification(message: string) {
    // Implement notification display logic
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
```

## Error Handling

### Connection Errors
```javascript
socket.on('connect_error', (error) => {
  if (error.message === 'Authentication error') {
    // Refresh token and reconnect
    refreshAuthToken().then(newToken => {
      socket.auth.token = newToken;
      socket.connect();
    });
  }
});
```

### Event Processing Errors
```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Handle specific error types
  switch (error.type) {
    case 'PERMISSION_DENIED':
      // Handle permission error
      break;
    case 'INVALID_DATA':
      // Handle data validation error
      break;
    default:
      // Handle generic error
  }
});
```

## Performance Considerations

### Event Throttling
```javascript
// Throttle high-frequency events
const throttledStockUpdate = throttle((data) => {
  socket.emit('inventory:stock_updated', data);
}, 1000);
```

### Connection Pooling
```javascript
// Reuse connections across components
const socketManager = {
  connections: new Map(),

  getConnection(namespace: string) {
    if (!this.connections.has(namespace)) {
      this.connections.set(namespace, io(namespace));
    }
    return this.connections.get(namespace);
  }
};
```

This WebSocket event structure provides real-time communication capabilities essential for the Table Tap ordering system, ensuring all stakeholders stay informed of order status, inventory levels, and operational changes.