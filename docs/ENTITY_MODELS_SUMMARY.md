# Restaurant Ordering System - Entity Models

## Overview

This document outlines the comprehensive TypeORM entity models created for the restaurant ordering system. The system supports multi-tenant architecture with 14 core entities and 7 enum types.

## Architecture Features

### Multi-Tenant Support
- All entities include `cafeId` foreign key for multi-tenancy
- Proper cascade delete relationships
- Tenant-isolated data access

### Key Features Implemented
- **Configurable order workflows** per cafe
- **Multiple payment methods** (QR, Payconic, cash, credits)
- **Counter activation/deactivation** with labels
- **Employee proxy ordering** with audit trails
- **Inventory management** with reorder thresholds
- **Optional glass tracking** system
- **Customer credit system**
- **Transaction logging** and audit trails

## Core Entities

### 1. Cafe (Multi-tenant root)
- **Purpose**: Central tenant entity for cafe configuration
- **Key Features**:
  - Business information and settings
  - Configurable workflows and payment methods
  - Business hours management
  - Currency and tax settings
- **Location**: `libs/models/models/src/models/cafe.model.ts`

### 2. User (Enhanced with roles)
- **Purpose**: Customers, employees, and administrators
- **Key Features**:
  - Role-based access (Customer, Employee, Manager, Admin, etc.)
  - Authentication integration (sub field for Auth0)
  - Customer credit balance tracking
  - VIP and loyalty program support
  - Preferences and dietary restrictions
- **Location**: `libs/models/models/src/models/user.model.ts`

### 3. Product (Inventory-aware)
- **Purpose**: Menu items and products
- **Key Features**:
  - Category-based organization
  - Inventory tracking (optional)
  - Pricing with discount support
  - Counter routing configuration
  - Customization attributes (size, temperature, etc.)
  - Allergen and nutrition information
- **Location**: `libs/models/models/src/models/product.model.ts`

### 4. Order (Workflow-enabled)
- **Purpose**: Customer orders with status tracking
- **Key Features**:
  - Configurable workflow steps
  - Employee proxy ordering support
  - Multiple order types (dine-in, takeaway, delivery)
  - Timing and preparation tracking
  - Customer information capture
- **Location**: `libs/models/models/src/models/order.model.ts`

### 5. OrderItem (Detailed line items)
- **Purpose**: Individual items within orders
- **Key Features**:
  - Product snapshot at order time
  - Customization tracking
  - Counter-specific status tracking
  - Pricing breakdown
- **Location**: `libs/models/models/src/models/order-item.model.ts`

### 6. Payment (Multi-method support)
- **Purpose**: Payment transactions and processing
- **Key Features**:
  - Multiple payment methods (QR, Payconic, cash, credits)
  - Authorization and capture flow
  - Refund management
  - Provider-specific data storage
  - Audit trail with employee tracking
- **Location**: `libs/models/models/src/models/payment.model.ts`

### 7. Counter (Kitchen/Bar routing)
- **Purpose**: Kitchen and bar counter management
- **Key Features**:
  - Type-based organization (kitchen, bar, coffee, etc.)
  - Active/inactive status management
  - Load balancing with concurrent order limits
  - Product category assignment
  - Working hours configuration
- **Location**: `libs/models/models/src/models/counter.model.ts`

### 8. Employee (Staff management)
- **Purpose**: Employee profiles and permissions
- **Key Features**:
  - Position and role management
  - Compensation tracking
  - Access control permissions
  - Counter assignment
  - Clock in/out status
  - Emergency contact information
- **Location**: `libs/models/models/src/models/employee.model.ts`

### 9. TimeSheet & TimeEntry (Time tracking)
- **Purpose**: Employee work session tracking
- **Key Features**:
  - Scheduled vs actual time tracking
  - Break time management
  - Pay calculation support
  - GPS location tracking (optional)
  - Approval workflow
  - Multiple entry types (clock in/out, breaks)
- **Locations**:
  - `libs/models/models/src/models/time-sheet.model.ts`

### 10. Stock & StockMovement (Inventory)
- **Purpose**: Inventory management and tracking
- **Key Features**:
  - Current stock levels with reservations
  - Reorder level management
  - Cost tracking (FIFO/LIFO support)
  - Movement history with audit trail
  - Batch/lot tracking
  - Low stock alerts
- **Location**: `libs/models/models/src/models/stock.model.ts`

### 11. Purchase & PurchaseItem (Procurement)
- **Purpose**: Stock purchase management
- **Key Features**:
  - Supplier relationship tracking
  - Purchase order workflow
  - Item-level tracking with batches
  - Payment and delivery tracking
  - Approval workflow
- **Location**: `libs/models/models/src/models/purchase.model.ts`

### 12. Glass & GlassMovement (Glass tracking)
- **Purpose**: Reusable glass tracking system
- **Key Features**:
  - RFID/QR code integration
  - Movement history (issued, returned, cleaned)
  - Customer assignment tracking
  - Deposit management
  - Loss and breakage tracking
- **Location**: `libs/models/models/src/models/glass.model.ts`

### 13. Credit (Customer credits)
- **Purpose**: Customer credit system
- **Key Features**:
  - Transaction history with balance tracking
  - Promotional credit support
  - Expiry date management
  - Usage restrictions
  - Audit trail with employee tracking
- **Location**: `libs/models/models/src/models/credit.model.ts`

### 14. Configuration (Cafe settings)
- **Purpose**: Flexible cafe-specific configuration
- **Key Features**:
  - JSON-based value storage
  - Data type validation
  - UI metadata for admin interfaces
  - Change tracking and audit
  - Grouping and categorization
- **Location**: `libs/models/models/src/models/configuration.model.ts`

## Enum Types

### Order Management
- **OrderStatus**: pending, confirmed, preparing, ready, delivered, cancelled, refunded, failed
- **PaymentMethod**: qr, payconic, cash, credit, card, mobile, voucher
- **PaymentStatus**: pending, authorized, captured, completed, failed, cancelled, refunded

### Product Management
- **ProductCategory**: coffee, tea, cold_drinks, food, snacks, etc.
- **ProductStatus**: active, inactive, out_of_stock, discontinued

### User Management
- **UserRole**: customer, employee, manager, admin, owner, cashier, barista, kitchen, waiter
- **UserStatus**: active, inactive, suspended, pending_verification, banned

### Operations
- **CounterType**: kitchen, bar, coffee, pastry, cold_prep, hot_prep, assembly, pickup
- **CounterStatus**: active, inactive, maintenance, offline
- **EmployeeStatus**: active, inactive, on_break, off_duty, sick_leave, vacation, terminated
- **ShiftStatus**: scheduled, started, on_break, completed, no_show, cancelled

### Transactions
- **TransactionType**: purchase, refund, credit_add, credit_deduct, stock_purchase, adjustment
- **StockMovementType**: purchase, sale, waste, adjustment, transfer, return

## Database Relationships

### Core Relationships
```
Cafe (1) ←→ (N) User
Cafe (1) ←→ (N) Product
Cafe (1) ←→ (N) Order
Cafe (1) ←→ (N) Counter
Cafe (1) ←→ (N) Employee

User (1) ←→ (N) Order (as customer)
User (1) ←→ (N) Order (as employee proxy)
User (1) ←→ (N) Credit
User (1) ←→ (N) Employee (optional relationship)

Order (1) ←→ (N) OrderItem
Order (1) ←→ (N) Payment

Product (1) ←→ (N) OrderItem
Product (1) ←→ (N) Stock

Employee (1) ←→ (N) TimeSheet
TimeSheet (1) ←→ (N) TimeEntry

Purchase (1) ←→ (N) PurchaseItem
Stock (1) ←→ (N) StockMovement

Glass (1) ←→ (N) GlassMovement
```

## Indexing Strategy

### Performance Indexes
- Multi-tenant indexes: `[cafeId, *]` on all entities
- Search indexes: Full-text on names and descriptions
- Unique constraints: Slugs, email, phone (with partial indexes)
- Temporal indexes: `createdAt`, `updatedAt` for time-based queries
- Status indexes: For filtering active/inactive records

### Query Optimization
- Composite indexes for common filter combinations
- Partial indexes for nullable unique fields
- Foreign key indexes for relationship queries

## Features Supported

### 1. Configurable Order Workflows
```typescript
// Example workflow configuration
workflowSteps: [
  { stepName: 'confirmed', status: 'pending', assignedCounterId: 'counter-1' },
  { stepName: 'preparing', status: 'in_progress', assignedCounterId: 'counter-1' },
  { stepName: 'ready', status: 'completed', assignedCounterId: 'counter-2' }
]
```

### 2. Multiple Payment Methods
- QR code payments (Payconic integration ready)
- Cash transactions
- Card payments
- Customer credit system
- Mobile wallet support

### 3. Counter Management
- Dynamic counter activation/deactivation
- Load balancing with concurrent order limits
- Product category routing
- Custom labels for display

### 4. Employee Management
- Role-based permissions
- Time tracking with break management
- Proxy ordering capabilities
- Performance analytics ready

### 5. Inventory Management
- Real-time stock tracking
- Automated reorder alerts
- Cost tracking with movement history
- Batch/lot tracking for expiry management

### 6. Glass Tracking (Optional)
- RFID/QR integration ready
- Complete lifecycle tracking
- Deposit management
- Loss prevention

### 7. Customer Credit System
- Balance tracking with transaction history
- Promotional credit support
- Expiry and restriction management
- Audit trail compliance

## Migration Commands

```bash
# Generate migration
npm run migrate:create

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:undo
```

## Configuration Examples

### Cafe Settings
```json
{
  "currency": "EUR",
  "timezone": "Europe/Brussels",
  "taxRate": 0.21,
  "serviceCharge": 0.10,
  "enableGlassTracking": true,
  "enableCredits": true,
  "workflowSteps": ["confirmed", "preparing", "ready", "delivered"],
  "paymentMethods": ["qr", "cash", "card", "credits"]
}
```

### Order Workflow Configuration
```json
{
  "order_workflow_steps": [
    "confirmed",
    "preparing",
    "ready",
    "delivered"
  ]
}
```

### Payment Methods Configuration
```json
{
  "payment_methods": [
    "qr",
    "payconic",
    "cash",
    "credits",
    "card"
  ]
}
```

## Next Steps

1. **Run Migrations**: Execute `npm run migrate:create` to generate initial migration files
2. **Seed Data**: Create seed scripts for initial cafe setup
3. **GraphQL Resolvers**: Implement resolvers for the GraphQL schema
4. **API Endpoints**: Create REST endpoints for mobile/web integration
5. **Business Logic**: Implement service layers for order processing
6. **Integration**: Connect with payment providers (Payconic, etc.)
7. **Testing**: Create comprehensive test suites for all entities

## Files Created

### Enum Files
- `libs/models/enum/src/enums/order-status.enum.ts`
- `libs/models/enum/src/enums/payment-method.enum.ts`
- `libs/models/enum/src/enums/product-category.enum.ts`
- `libs/models/enum/src/enums/user-role.enum.ts`
- `libs/models/enum/src/enums/counter-type.enum.ts`
- `libs/models/enum/src/enums/employee-status.enum.ts`
- `libs/models/enum/src/enums/transaction-type.enum.ts`

### Entity Files
- `libs/models/models/src/models/cafe.model.ts`
- `libs/models/models/src/models/user.model.ts` (enhanced)
- `libs/models/models/src/models/product.model.ts`
- `libs/models/models/src/models/order.model.ts`
- `libs/models/models/src/models/order-item.model.ts`
- `libs/models/models/src/models/payment.model.ts`
- `libs/models/models/src/models/counter.model.ts`
- `libs/models/models/src/models/employee.model.ts`
- `libs/models/models/src/models/time-sheet.model.ts`
- `libs/models/models/src/models/stock.model.ts`
- `libs/models/models/src/models/purchase.model.ts`
- `libs/models/models/src/models/glass.model.ts`
- `libs/models/models/src/models/credit.model.ts`
- `libs/models/models/src/models/configuration.model.ts`

### Configuration Files
- `libs/models/models/src/models/index.ts` (updated)
- `libs/models/enum/src/enums/index.ts` (updated)
- `libs/backend/database/src/orm.config.ts` (updated)

The system is now ready for migration generation and implementation of business logic layers.