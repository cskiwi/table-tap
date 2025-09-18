# API Contract Specification

## Overview

This document defines the complete API contract for the Restaurant Ordering System, including RESTful endpoints, request/response schemas, authentication requirements, and error handling.

## Base Configuration

- **Base URL**: `https://api.table-tap.com/v1`
- **Authentication**: Bearer JWT tokens
- **Content-Type**: `application/json`
- **Rate Limiting**: 100 requests/minute per authenticated user, 20/minute for unauthenticated

## Authentication Endpoints

### POST /auth/login
Employee authentication endpoint.

```yaml
Request:
  body:
    type: object
    required: [identifier, password, cafeId]
    properties:
      identifier:
        type: string
        description: Employee ID, email, or NFC badge ID
        example: "emp001"
      password:
        type: string
        minLength: 6
        description: Employee password or PIN
      cafeId:
        type: string
        format: uuid
        description: Cafe location identifier
      deviceId:
        type: string
        description: Device identifier for session tracking

Response (200):
  body:
    type: object
    properties:
      token:
        type: string
        description: JWT access token (24h expiry)
      refreshToken:
        type: string
        description: Refresh token (30 days expiry)
      employee:
        $ref: '#/components/schemas/Employee'
      permissions:
        type: array
        items:
          type: string
        description: Employee role permissions
      cafeConfig:
        $ref: '#/components/schemas/CafeConfig'

Errors:
  401: Invalid credentials
  403: Employee not authorized for this cafe
  423: Account locked due to failed attempts
  500: Authentication service unavailable
```

### POST /auth/refresh
Refresh expired access token.

```yaml
Request:
  body:
    type: object
    required: [refreshToken]
    properties:
      refreshToken:
        type: string

Response (200):
  body:
    type: object
    properties:
      token:
        type: string
      expiresIn:
        type: number
        description: Token expiry in seconds

Errors:
  401: Invalid refresh token
  403: Refresh token expired
```

### POST /auth/logout
Invalidate current session.

```yaml
Request:
  headers:
    Authorization: Bearer {token}

Response (204): No content

Errors:
  401: Invalid or expired token
```

## Customer Endpoints

### POST /customers
Register new customer or update existing.

```yaml
Request:
  body:
    type: object
    required: [phone]
    properties:
      phone:
        type: string
        pattern: "^\\+[1-9]\\d{1,14}$"
        description: International phone number
      email:
        type: string
        format: email
      name:
        type: string
        maxLength: 100
      preferences:
        type: object
        properties:
          language:
            type: string
            enum: [en, fr, nl, de]
          notifications:
            type: boolean

Response (201):
  body:
    $ref: '#/components/schemas/Customer'

Errors:
  400: Invalid phone number format
  409: Phone number already registered
```

### GET /customers/{customerId}
Retrieve customer details.

```yaml
Parameters:
  customerId:
    type: string
    format: uuid

Response (200):
  body:
    $ref: '#/components/schemas/Customer'

Errors:
  404: Customer not found
  403: Access denied
```

### GET /customers/{customerId}/orders
Retrieve customer order history.

```yaml
Parameters:
  customerId:
    type: string
    format: uuid
  limit:
    type: integer
    minimum: 1
    maximum: 100
    default: 20
  offset:
    type: integer
    minimum: 0
    default: 0
  status:
    type: string
    enum: [pending, confirmed, preparing, ready, completed, cancelled]

Response (200):
  body:
    type: object
    properties:
      orders:
        type: array
        items:
          $ref: '#/components/schemas/Order'
      pagination:
        $ref: '#/components/schemas/Pagination'
```

## Menu Endpoints

### GET /cafes/{cafeId}/menu
Retrieve cafe menu with current pricing and availability.

```yaml
Parameters:
  cafeId:
    type: string
    format: uuid
  category:
    type: string
    enum: [hot-drinks, cold-drinks, food, pastry, snacks]
  available:
    type: boolean
    default: true

Response (200):
  body:
    type: object
    properties:
      categories:
        type: array
        items:
          $ref: '#/components/schemas/MenuCategory'
      lastModified:
        type: string
        format: date-time

Errors:
  404: Cafe not found
```

### GET /menu-items/{itemId}
Retrieve detailed item information.

```yaml
Parameters:
  itemId:
    type: string
    format: uuid

Response (200):
  body:
    $ref: '#/components/schemas/MenuItem'
```

## Order Management Endpoints

### POST /orders
Create new order.

```yaml
Request:
  body:
    type: object
    required: [cafeId, items, orderType]
    properties:
      cafeId:
        type: string
        format: uuid
      customerId:
        type: string
        format: uuid
        description: Optional for anonymous orders
      items:
        type: array
        minItems: 1
        items:
          $ref: '#/components/schemas/OrderItem'
      orderType:
        type: string
        enum: [dine-in, takeaway, delivery]
      tableNumber:
        type: integer
        minimum: 1
        description: Required for dine-in orders
      specialInstructions:
        type: string
        maxLength: 500
      proxyEmployeeId:
        type: string
        format: uuid
        description: Employee placing order on behalf of customer

Response (201):
  body:
    $ref: '#/components/schemas/Order'

Errors:
  400: Invalid order data
  404: Cafe or menu items not found
  409: Table already occupied
  422: Items not available
```

### GET /orders/{orderId}
Retrieve order details.

```yaml
Parameters:
  orderId:
    type: string
    format: uuid

Response (200):
  body:
    $ref: '#/components/schemas/Order'

Errors:
  404: Order not found
  403: Access denied
```

### PATCH /orders/{orderId}/status
Update order status (staff only).

```yaml
Request:
  headers:
    Authorization: Bearer {token}
  body:
    type: object
    required: [status]
    properties:
      status:
        type: string
        enum: [confirmed, preparing, ready, completed, cancelled]
      counterId:
        type: string
        format: uuid
        description: Counter handling the order
      estimatedTime:
        type: integer
        description: Estimated completion time in minutes
      notes:
        type: string
        maxLength: 200

Response (200):
  body:
    $ref: '#/components/schemas/Order'

Errors:
  400: Invalid status transition
  401: Authentication required
  403: Insufficient permissions
  404: Order not found
```

### POST /orders/{orderId}/cancel
Cancel order (customer or staff).

```yaml
Request:
  body:
    type: object
    properties:
      reason:
        type: string
        enum: [customer-request, item-unavailable, payment-failed, other]
      notes:
        type: string
        maxLength: 200

Response (200):
  body:
    $ref: '#/components/schemas/Order'

Errors:
  400: Cannot cancel order in current status
  404: Order not found
  422: Cancellation window expired
```

## Payment Endpoints

### POST /payments/qr-code
Generate QR code for bank transfer payment.

```yaml
Request:
  body:
    type: object
    required: [orderId, amount]
    properties:
      orderId:
        type: string
        format: uuid
      amount:
        type: number
        multipleOf: 0.01
        minimum: 0.01
      currency:
        type: string
        enum: [EUR]
        default: EUR

Response (201):
  body:
    type: object
    properties:
      qrCode:
        type: string
        description: Base64 encoded QR code image
      qrData:
        type: string
        description: QR code content for manual entry
      paymentReference:
        type: string
        description: Structured communication reference
      expiresAt:
        type: string
        format: date-time
      bankDetails:
        $ref: '#/components/schemas/BankDetails'

Errors:
  400: Invalid amount or order
  404: Order not found
  409: Payment already processed
```

### POST /payments/payconic
Process card payment via Payconic.

```yaml
Request:
  body:
    type: object
    required: [orderId, amount, paymentMethod]
    properties:
      orderId:
        type: string
        format: uuid
      amount:
        type: number
        multipleOf: 0.01
      paymentMethod:
        type: object
        properties:
          type:
            type: string
            enum: [card, saved-card]
          cardToken:
            type: string
            description: Tokenized card for saved payments
          card:
            $ref: '#/components/schemas/CardDetails'
      tipAmount:
        type: number
        multipleOf: 0.01
        minimum: 0
      saveCard:
        type: boolean
        default: false

Response (200):
  body:
    type: object
    properties:
      transactionId:
        type: string
      status:
        type: string
        enum: [success, requires_3ds, failed]
      threeDSUrl:
        type: string
        description: 3DS authentication URL if required
      paymentReference:
        type: string

Errors:
  400: Invalid payment data
  402: Payment declined
  404: Order not found
  422: Payment amount mismatch
  503: Payment service unavailable
```

### POST /payments/cash
Record cash payment (staff only).

```yaml
Request:
  headers:
    Authorization: Bearer {token}
  body:
    type: object
    required: [orderId, amountReceived]
    properties:
      orderId:
        type: string
        format: uuid
      amountReceived:
        type: number
        multipleOf: 0.01
      tipAmount:
        type: number
        multipleOf: 0.01
        default: 0

Response (200):
  body:
    type: object
    properties:
      transactionId:
        type: string
      changeAmount:
        type: number
      receiptNumber:
        type: string

Errors:
  400: Insufficient amount received
  401: Authentication required
  403: Cash payments not permitted for this role
  404: Order not found
```

### POST /payments/credit
Process payment using customer credit.

```yaml
Request:
  body:
    type: object
    required: [customerId, orderId, amount]
    properties:
      customerId:
        type: string
        format: uuid
      orderId:
        type: string
        format: uuid
      amount:
        type: number
        multipleOf: 0.01
      fallbackPayment:
        type: object
        description: Secondary payment for insufficient credit
        properties:
          method:
            type: string
            enum: [card, cash]
          details:
            type: object

Response (200):
  body:
    type: object
    properties:
      transactionId:
        type: string
      creditUsed:
        type: number
      remainingCredit:
        type: number
      fallbackAmount:
        type: number
        description: Amount charged to fallback method

Errors:
  400: Invalid payment data
  404: Customer or order not found
  422: Insufficient credit and no fallback method
```

## Employee Management Endpoints

### GET /employees/{employeeId}/timesheet
Retrieve employee timesheet.

```yaml
Parameters:
  employeeId:
    type: string
    format: uuid
  startDate:
    type: string
    format: date
  endDate:
    type: string
    format: date
  status:
    type: string
    enum: [draft, submitted, approved]

Headers:
  Authorization: Bearer {token}

Response (200):
  body:
    type: object
    properties:
      entries:
        type: array
        items:
          $ref: '#/components/schemas/TimesheetEntry'
      totalHours:
        type: number
      regularHours:
        type: number
      overtimeHours:
        type: number

Errors:
  401: Authentication required
  403: Access denied
  404: Employee not found
```

### POST /employees/{employeeId}/clock-in
Record employee clock-in.

```yaml
Request:
  headers:
    Authorization: Bearer {token}
  body:
    type: object
    properties:
      location:
        type: object
        properties:
          latitude:
            type: number
          longitude:
            type: number
      deviceId:
        type: string

Response (201):
  body:
    $ref: '#/components/schemas/TimesheetEntry'

Errors:
  400: Already clocked in
  401: Authentication required
  422: Location verification failed
```

### POST /employees/{employeeId}/clock-out
Record employee clock-out.

```yaml
Request:
  headers:
    Authorization: Bearer {token}

Response (200):
  body:
    $ref: '#/components/schemas/TimesheetEntry'

Errors:
  400: Not clocked in
  401: Authentication required
```

### GET /employees/{employeeId}/consumption
Retrieve employee consumption tracking.

```yaml
Parameters:
  employeeId:
    type: string
    format: uuid
  startDate:
    type: string
    format: date
  endDate:
    type: string
    format: date

Headers:
  Authorization: Bearer {token}

Response (200):
  body:
    type: object
    properties:
      items:
        type: array
        items:
          $ref: '#/components/schemas/ConsumptionItem'
      totalValue:
        type: number
      discountApplied:
        type: number
      limitRemaining:
        type: number

Errors:
  401: Authentication required
  403: Access denied
  404: Employee not found
```

## Counter Management Endpoints

### GET /cafes/{cafeId}/counters
Retrieve all counters for a cafe.

```yaml
Parameters:
  cafeId:
    type: string
    format: uuid

Response (200):
  body:
    type: array
    items:
      $ref: '#/components/schemas/Counter'
```

### PATCH /counters/{counterId}/status
Update counter status (managers only).

```yaml
Request:
  headers:
    Authorization: Bearer {token}
  body:
    type: object
    required: [status]
    properties:
      status:
        type: string
        enum: [active, inactive, maintenance]
      reason:
        type: string
        maxLength: 200

Response (200):
  body:
    $ref: '#/components/schemas/Counter'

Errors:
  401: Authentication required
  403: Manager role required
  404: Counter not found
```

## Data Schemas

### Employee
```yaml
Employee:
  type: object
  properties:
    id:
      type: string
      format: uuid
    employeeId:
      type: string
      description: Human-readable employee identifier
    name:
      type: string
    email:
      type: string
      format: email
    role:
      type: string
      enum: [admin, manager, barista, cashier]
    cafeId:
      type: string
      format: uuid
    isActive:
      type: boolean
    lastLogin:
      type: string
      format: date-time
    permissions:
      type: array
      items:
        type: string
```

### Customer
```yaml
Customer:
  type: object
  properties:
    id:
      type: string
      format: uuid
    phone:
      type: string
    email:
      type: string
      format: email
    name:
      type: string
    creditBalance:
      type: number
      multipleOf: 0.01
    totalOrders:
      type: integer
    lastOrderDate:
      type: string
      format: date-time
    preferences:
      type: object
    isVip:
      type: boolean
```

### Order
```yaml
Order:
  type: object
  properties:
    id:
      type: string
      format: uuid
    orderNumber:
      type: string
      description: Human-readable order number
    cafeId:
      type: string
      format: uuid
    customerId:
      type: string
      format: uuid
    items:
      type: array
      items:
        $ref: '#/components/schemas/OrderItem'
    status:
      type: string
      enum: [pending, confirmed, preparing, ready, completed, cancelled]
    orderType:
      type: string
      enum: [dine-in, takeaway, delivery]
    tableNumber:
      type: integer
    subtotal:
      type: number
      multipleOf: 0.01
    tipAmount:
      type: number
      multipleOf: 0.01
    tax:
      type: number
      multipleOf: 0.01
    total:
      type: number
      multipleOf: 0.01
    paymentStatus:
      type: string
      enum: [pending, paid, refunded, partially-refunded]
    specialInstructions:
      type: string
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
    estimatedCompletionTime:
      type: string
      format: date-time
    proxyEmployee:
      $ref: '#/components/schemas/Employee'
    counters:
      type: array
      items:
        $ref: '#/components/schemas/Counter'
```

### OrderItem
```yaml
OrderItem:
  type: object
  properties:
    menuItemId:
      type: string
      format: uuid
    name:
      type: string
    quantity:
      type: integer
      minimum: 1
    unitPrice:
      type: number
      multipleOf: 0.01
    totalPrice:
      type: number
      multipleOf: 0.01
    customizations:
      type: array
      items:
        type: object
        properties:
          type:
            type: string
          value:
            type: string
          priceModifier:
            type: number
    tags:
      type: array
      items:
        type: string
        enum: [hot-drinks, cold-drinks, food, pastry, snacks]
```

### MenuItem
```yaml
MenuItem:
  type: object
  properties:
    id:
      type: string
      format: uuid
    name:
      type: string
    description:
      type: string
    price:
      type: number
      multipleOf: 0.01
    category:
      type: string
    tags:
      type: array
      items:
        type: string
    isAvailable:
      type: boolean
    allergens:
      type: array
      items:
        type: string
    nutritionalInfo:
      type: object
    customizations:
      type: array
      items:
        $ref: '#/components/schemas/MenuCustomization'
    imageUrl:
      type: string
      format: uri
```

## Error Responses

All error responses follow this format:

```yaml
ErrorResponse:
  type: object
  properties:
    error:
      type: object
      properties:
        code:
          type: string
          description: Machine-readable error code
        message:
          type: string
          description: Human-readable error message
        details:
          type: object
          description: Additional error context
        timestamp:
          type: string
          format: date-time
        requestId:
          type: string
          description: Unique request identifier for debugging
```

## Rate Limiting Headers

All responses include rate limiting headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 60
```

## Versioning

- API version specified in URL path: `/v1/`
- Backward compatibility maintained for 12 months
- Deprecation notices via `X-API-Deprecation` header
- Version sunset communicated 6 months in advance