# API Endpoints Specification

## API Design Principles

### RESTful Design
- Resource-based URLs
- HTTP methods for operations (GET, POST, PUT, PATCH, DELETE)
- Consistent response format
- Proper HTTP status codes

### Authentication
- JWT Bearer tokens
- Refresh token mechanism
- Role-based access control

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "meta": {
    "pagination": {},
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0"
  },
  "errors": []
}
```

## Base URL Structure
```
Production: https://api.tabletap.com/v1
Development: https://dev-api.tabletap.com/v1
Local: http://localhost:3000/api/v1
```

## Authentication Endpoints

### POST /auth/login
Login with email and password
```json
// Request
{
  "email": "user@example.com",
  "password": "password123",
  "cafe_slug": "downtown-cafe"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "roles": ["employee"]
    },
    "tokens": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_in": 3600
    },
    "cafe": {
      "id": "uuid",
      "name": "Downtown Cafe",
      "slug": "downtown-cafe"
    }
  }
}
```

### POST /auth/refresh
Refresh access token
```json
// Request
{
  "refresh_token": "refresh_token_here"
}

// Response
{
  "success": true,
  "data": {
    "access_token": "new_jwt_token",
    "expires_in": 3600
  }
}
```

### POST /auth/logout
Logout and invalidate tokens
```json
// Response
{
  "success": true,
  "message": "Successfully logged out"
}
```

## User Management Endpoints

### GET /users/profile
Get current user profile
```json
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "avatar_url": "https://...",
    "roles": [
      {
        "role": "employee",
        "permissions": ["view_orders", "create_orders"],
        "employee_id": "EMP001"
      }
    ],
    "preferences": {},
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /users/profile
Update user profile
```json
// Request
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

### POST /users/register
Register new customer
```json
// Request
{
  "email": "customer@example.com",
  "password": "password123",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "cafe_slug": "downtown-cafe"
}
```

## Menu Endpoints

### GET /cafes/{cafe_id}/menu
Get complete menu with categories and products
```json
// Query parameters: ?include_inactive=false&category_id=uuid
// Response
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Coffee",
        "description": "Premium coffee drinks",
        "image_url": "https://...",
        "sort_order": 1,
        "products": [
          {
            "id": "uuid",
            "name": "Espresso",
            "description": "Strong coffee shot",
            "image_url": "https://...",
            "base_price": 3.50,
            "is_available": true,
            "current_stock": 25,
            "requires_glass": false,
            "variants": [
              {
                "id": "uuid",
                "name": "Double Shot",
                "price_modifier": 1.00
              }
            ],
            "metadata": {
              "caffeine_mg": 150,
              "calories": 5
            }
          }
        ]
      }
    ]
  }
}
```

### GET /cafes/{cafe_id}/products/{product_id}
Get product details
```json
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Espresso",
    "description": "Strong coffee shot",
    "image_url": "https://...",
    "base_price": 3.50,
    "current_stock": 25,
    "is_available": true,
    "variants": [...],
    "category": {
      "id": "uuid",
      "name": "Coffee"
    }
  }
}
```

## Order Management Endpoints

### POST /cafes/{cafe_id}/orders
Create new order
```json
// Request
{
  "customer_info": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  },
  "items": [
    {
      "product_id": "uuid",
      "variant_id": "uuid",
      "quantity": 2,
      "customizations": [
        {
          "type": "size",
          "value": "large",
          "price_modifier": 0.50
        }
      ],
      "special_instructions": "Extra hot"
    }
  ],
  "payment_method": "card",
  "tip_amount": 2.00,
  "notes": "Rush order",
  "proxy_order_for_user_id": "uuid" // Optional for employee proxy orders
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "ORD20240101001",
    "status": "pending",
    "customer_info": {...},
    "items": [...],
    "pricing": {
      "subtotal": 10.50,
      "tax_amount": 1.05,
      "tip_amount": 2.00,
      "total_amount": 13.55
    },
    "payment": {
      "method": "card",
      "status": "pending",
      "qr_code_data": "payment_qr_data", // If QR payment
      "qr_expires_at": "2024-01-01T01:00:00Z"
    },
    "assigned_counter": "Counter 1",
    "estimated_ready_at": "2024-01-01T00:15:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /cafes/{cafe_id}/orders
Get orders list with filtering
```json
// Query parameters:
// ?status=pending&counter=Counter1&date=2024-01-01&customer_id=uuid
// &page=1&limit=20&sort=created_at&order=desc

// Response
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "order_number": "ORD20240101001",
        "status": "preparing",
        "customer_name": "John Doe",
        "total_amount": 13.55,
        "assigned_counter": "Counter 1",
        "items_count": 2,
        "estimated_ready_at": "2024-01-01T00:15:00Z",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### GET /cafes/{cafe_id}/orders/{order_id}
Get order details
```json
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "ORD20240101001",
    "status": "preparing",
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
    ],
    "customer_info": {...},
    "items": [...],
    "payment": {...},
    "assigned_counter": "Counter 1",
    "created_by": {
      "id": "uuid",
      "name": "Jane Employee"
    },
    "proxy_order_info": {
      "ordered_for": {
        "id": "uuid",
        "name": "John Employee"
      }
    }
  }
}
```

### PATCH /cafes/{cafe_id}/orders/{order_id}/status
Update order status
```json
// Request
{
  "status": "ready",
  "notes": "Order completed",
  "estimated_ready_at": "2024-01-01T00:20:00Z" // Optional
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ready",
    "updated_at": "2024-01-01T00:20:00Z"
  }
}
```

### POST /cafes/{cafe_id}/orders/{order_id}/cancel
Cancel order
```json
// Request
{
  "reason": "Customer requested cancellation",
  "refund_amount": 13.55
}
```

## Payment Endpoints

### POST /payments/process
Process payment for order
```json
// Request
{
  "order_id": "uuid",
  "payment_method": "card",
  "amount": 13.55,
  "provider": "payconic",
  "provider_data": {
    "card_token": "token_here",
    "billing_info": {...}
  }
}

// Response
{
  "success": true,
  "data": {
    "transaction_id": "txn_uuid",
    "status": "completed",
    "amount": 13.55,
    "fee_amount": 0.45,
    "net_amount": 13.10,
    "provider_response": {...}
  }
}
```

### POST /payments/qr/generate
Generate QR code for payment
```json
// Request
{
  "order_id": "uuid",
  "amount": 13.55,
  "expires_in": 300 // seconds
}

// Response
{
  "success": true,
  "data": {
    "qr_code_data": "payment_qr_string",
    "qr_code_url": "https://api.example.com/qr/uuid",
    "expires_at": "2024-01-01T00:05:00Z"
  }
}
```

### GET /payments/qr/{qr_id}/status
Check QR payment status
```json
// Response
{
  "success": true,
  "data": {
    "status": "completed", // pending, completed, expired, failed
    "transaction_id": "txn_uuid",
    "amount": 13.55
  }
}
```

## Credit System Endpoints

### GET /cafes/{cafe_id}/users/{user_id}/credit
Get user credit balance
```json
// Response
{
  "success": true,
  "data": {
    "balance": 25.50,
    "last_updated": "2024-01-01T00:00:00Z"
  }
}
```

### POST /cafes/{cafe_id}/users/{user_id}/credit/add
Add credit to user account
```json
// Request
{
  "amount": 20.00,
  "payment_method": "card",
  "description": "Credit top-up"
}
```

### POST /cafes/{cafe_id}/users/{user_id}/credit/deduct
Deduct credit from user account
```json
// Request
{
  "amount": 10.50,
  "order_id": "uuid",
  "description": "Order payment"
}
```

### GET /cafes/{cafe_id}/users/{user_id}/credit/transactions
Get credit transaction history
```json
// Response
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "credit",
        "amount": 20.00,
        "balance_after": 25.50,
        "description": "Credit top-up",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

## Employee Management Endpoints

### GET /cafes/{cafe_id}/employees
Get employees list
```json
// Response
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "uuid",
        "employee_id": "EMP001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "role": "employee",
        "is_active": true,
        "current_shift": {
          "clock_in_time": "2024-01-01T08:00:00Z",
          "status": "active"
        }
      }
    ]
  }
}
```

### POST /cafes/{cafe_id}/timesheets/clock-in
Clock in employee
```json
// Request
{
  "user_id": "uuid",
  "notes": "Started shift"
}

// Response
{
  "success": true,
  "data": {
    "timesheet_id": "uuid",
    "clock_in_time": "2024-01-01T08:00:00Z",
    "status": "active"
  }
}
```

### POST /cafes/{cafe_id}/timesheets/clock-out
Clock out employee
```json
// Request
{
  "timesheet_id": "uuid",
  "notes": "End of shift"
}

// Response
{
  "success": true,
  "data": {
    "timesheet_id": "uuid",
    "clock_out_time": "2024-01-01T17:00:00Z",
    "total_hours": 8.5,
    "total_pay": 127.50
  }
}
```

### GET /cafes/{cafe_id}/employees/{user_id}/timesheets
Get employee timesheet history
```json
// Query: ?start_date=2024-01-01&end_date=2024-01-31&status=completed
// Response
{
  "success": true,
  "data": {
    "timesheets": [
      {
        "id": "uuid",
        "shift_date": "2024-01-01",
        "clock_in_time": "2024-01-01T08:00:00Z",
        "clock_out_time": "2024-01-01T17:00:00Z",
        "total_hours": 8.5,
        "hourly_rate": 15.00,
        "total_pay": 127.50,
        "status": "completed"
      }
    ],
    "summary": {
      "total_hours": 160.0,
      "total_pay": 2400.00,
      "days_worked": 20
    }
  }
}
```

### POST /cafes/{cafe_id}/employees/{user_id}/drinks
Track employee drink consumption
```json
// Request
{
  "product_id": "uuid",
  "quantity": 1,
  "order_id": "uuid", // Optional if from order
  "counted_against_allowance": true
}
```

### GET /cafes/{cafe_id}/employees/{user_id}/drinks
Get employee drink consumption
```json
// Query: ?month=2024-01
// Response
{
  "success": true,
  "data": {
    "drinks": [
      {
        "id": "uuid",
        "product_name": "Espresso",
        "quantity": 1,
        "date_consumed": "2024-01-01",
        "counted_against_allowance": true
      }
    ],
    "summary": {
      "total_drinks": 15,
      "allowance_used": 12,
      "allowance_limit": 20,
      "remaining_allowance": 8
    }
  }
}
```

## Inventory Management Endpoints

### GET /cafes/{cafe_id}/inventory
Get inventory levels
```json
// Query: ?low_stock=true&category_id=uuid&search=coffee
// Response
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Espresso Beans",
        "sku": "ESP001",
        "current_stock": 5,
        "reorder_level": 10,
        "max_stock": 100,
        "unit_cost": 12.50,
        "stock_value": 62.50,
        "last_restocked": "2024-01-01T00:00:00Z",
        "status": "low_stock"
      }
    ],
    "summary": {
      "total_products": 150,
      "low_stock_count": 12,
      "out_of_stock_count": 3,
      "total_value": 15000.00
    }
  }
}
```

### PATCH /cafes/{cafe_id}/inventory/{product_id}/adjust
Adjust inventory levels
```json
// Request
{
  "adjustment_type": "manual",
  "quantity_change": -5,
  "unit_cost": 12.50,
  "notes": "Damaged goods removed"
}

// Response
{
  "success": true,
  "data": {
    "product_id": "uuid",
    "previous_stock": 20,
    "new_stock": 15,
    "adjustment_id": "uuid"
  }
}
```

### POST /cafes/{cafe_id}/purchase-orders
Create purchase order
```json
// Request
{
  "supplier_name": "Coffee Suppliers Inc",
  "supplier_contact": "supplier@example.com",
  "items": [
    {
      "product_id": "uuid",
      "quantity_ordered": 50,
      "unit_cost": 12.50
    }
  ],
  "order_date": "2024-01-01",
  "expected_delivery_date": "2024-01-05",
  "notes": "Rush order needed"
}
```

### GET /cafes/{cafe_id}/purchase-orders
Get purchase orders
```json
// Response
{
  "success": true,
  "data": {
    "purchase_orders": [
      {
        "id": "uuid",
        "order_number": "PO20240101001",
        "supplier_name": "Coffee Suppliers Inc",
        "status": "pending",
        "total_amount": 625.00,
        "order_date": "2024-01-01",
        "items_count": 1
      }
    ]
  }
}
```

### POST /cafes/{cafe_id}/purchase-orders/{po_id}/receive
Mark purchase order as received
```json
// Request
{
  "items": [
    {
      "product_id": "uuid",
      "quantity_received": 48, // vs 50 ordered
      "notes": "2 units damaged"
    }
  ],
  "receipt_image_url": "https://...",
  "receipt_notes": "All items received except 2 damaged",
  "received_date": "2024-01-05"
}
```

## Analytics Endpoints

### GET /cafes/{cafe_id}/analytics/dashboard
Get dashboard analytics
```json
// Query: ?period=today|week|month|custom&start_date=2024-01-01&end_date=2024-01-31
// Response
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z",
      "label": "January 2024"
    },
    "metrics": {
      "total_orders": 1250,
      "completed_orders": 1200,
      "cancelled_orders": 50,
      "gross_revenue": 18750.00,
      "net_revenue": 17200.00,
      "avg_order_value": 15.00,
      "avg_prep_time": 8.5
    },
    "trends": {
      "orders_trend": 12.5, // % change from previous period
      "revenue_trend": 8.3
    },
    "top_products": [
      {
        "product_id": "uuid",
        "name": "Latte",
        "quantity_sold": 320,
        "revenue": 2240.00
      }
    ],
    "hourly_breakdown": [
      {
        "hour": 8,
        "orders": 45,
        "revenue": 675.00
      }
    ]
  }
}
```

### GET /cafes/{cafe_id}/analytics/products
Get product performance analytics
```json
// Response
{
  "success": true,
  "data": {
    "products": [
      {
        "product_id": "uuid",
        "name": "Latte",
        "category": "Coffee",
        "quantity_sold": 320,
        "revenue": 2240.00,
        "avg_price": 7.00,
        "profit_margin": 65.5,
        "stock_turns": 4.2
      }
    ]
  }
}
```

## Configuration Endpoints

### GET /cafes/{cafe_id}/settings
Get cafe settings
```json
// Response
{
  "success": true,
  "data": {
    "order_workflow": ["pending", "preparing", "ready", "completed"],
    "payment_methods": ["cash", "card", "qr", "credit"],
    "tip_suggestions": [0.10, 0.15, 0.20],
    "counters": [
      {
        "name": "Counter 1",
        "active": true,
        "max_capacity": 10
      }
    ],
    "features": {
      "glass_tracking_enabled": false,
      "proxy_ordering_enabled": true,
      "timesheet_required": true
    }
  }
}
```

### PUT /cafes/{cafe_id}/settings
Update cafe settings
```json
// Request
{
  "tip_suggestions": [0.12, 0.15, 0.18, 0.22],
  "prep_time_minutes": 12,
  "counters": [
    {
      "name": "Counter 1",
      "active": true,
      "max_capacity": 15
    }
  ]
}
```

## WebSocket Events (see websocket-events.md for detailed structure)

### Connection
```javascript
// Connect with authentication
const socket = io('/orders', {
  auth: {
    token: 'jwt_token_here'
  },
  query: {
    cafe_id: 'uuid'
  }
});
```

### Event Examples
```javascript
// Order status updates
socket.on('order:status_changed', (data) => {
  console.log('Order status changed:', data);
});

// New order notifications
socket.on('order:created', (data) => {
  console.log('New order:', data);
});

// Inventory alerts
socket.on('inventory:low_stock', (data) => {
  console.log('Low stock alert:', data);
});
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "code": "invalid_format",
      "message": "Email format is invalid"
    }
  ],
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting
- Default: 1000 requests per hour per user
- Authentication: 10 attempts per 15 minutes per IP
- Payment processing: 100 requests per hour per user

## API Versioning
- URL versioning: `/api/v1/`, `/api/v2/`
- Backward compatibility maintained for at least 12 months
- Deprecation notices provided 6 months in advance