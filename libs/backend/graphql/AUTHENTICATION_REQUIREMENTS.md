# GraphQL Authentication Requirements

This document outlines which GraphQL queries and mutations require authentication and which are publicly accessible.

## Overview

The GraphQL API uses two types of access control:

1. **Public Access (`@PublicAccess()`)**: No authentication required - accessible to anyone
2. **Protected Access (`@UseGuards(PermGuard)`)**: Authentication required - only accessible to authenticated users with proper permissions

## Public Routes (No Authentication Required)

These routes are essential for the cafe to function as a public-facing service:

### Menu Operations
- **`products(args)`** - View menu items (customers need to browse menu)
- **`product(id)`** - View individual product details

### Cafe Discovery
- **`cafeByHostname(hostname)`** - Find cafe by domain/hostname (required for initial page load)
- **`cafeHostnames(args)`** - List cafe hostnames (for hostname-based cafe detection)
- **`cafeHostname(id)`** - Get specific hostname details

### Ordering
- **`createOrder(input)`** - Create new order (allows guest checkout without account)

## Protected Routes (Authentication Required)

All other operations require authentication and proper permissions:

### Admin-Only Operations

#### Inventory Management
- `inventory(args)` - View inventory
- `inventoryItem(id)` - View inventory item
- `createInventoryItem(input)` - Create inventory item
- `updateInventoryItem(id, input)` - Update inventory item
- `deleteInventoryItem(id)` - Delete inventory item
- `adjustStock(productId, adjustment, reason)` - Adjust stock levels

#### Employee Management
- `employees(args)` - List employees
- `employee(id)` - View employee details
- `createEmployee(input)` - Create employee
- `updateEmployee(id, input)` - Update employee
- `deleteEmployee(id)` - Delete employee
- `assignRole(employeeId, role)` - Assign employee role

#### Analytics & Reports
- `salesAnalytics(startDate, endDate)` - View sales analytics
- `revenueReport(period)` - View revenue reports
- `popularProducts(limit)` - View popular products
- `employeePerformance(employeeId)` - View employee performance

#### Settings & Configuration
- `adminSettings(cafeId)` - View admin settings
- `updateAdminSettings(cafeId, input)` - Update admin settings
- `adminNotifications(args)` - View admin notifications
- `markNotificationRead(id)` - Mark notification as read

### Cafe Management
- `cafes(args)` - List user's cafes
- `cafe(id)` - View specific cafe (admin only)
- `myCafes()` - View user's associated cafes
- `createCafe(input)` - Create new cafe
- `updateCafe(id, input)` - Update cafe
- `deleteCafe(id)` - Delete cafe

### Menu Management (Admin)
- `createMenuItem(input)` - Create menu item
- `updateMenuItem(id, input)` - Update menu item
- `deleteMenuItem(id)` - Delete menu item

### Order Management
- `orders(args)` - List orders (filtered by user permissions)
- `order(id)` - View specific order
- `nextOrder(cafeId, counterId)` - Get next order for processing
- `updateOrderStatus(id, input)` - Update order status
- `updateOrder(id, input)` - Update order details
- `assignOrderToCounter(orderId, counterId)` - Assign order to counter
- `cancelOrder(id, reason)` - Cancel order

### Payment Operations
- `payments(args)` - List payments
- `payment(id)` - View payment details

### Loyalty Program
- `loyaltyAccounts(args)` - List loyalty accounts
- `loyaltyAccount(id)` - View loyalty account
- `loyaltyTransactions(args)` - List loyalty transactions
- `createLoyaltyTransaction(input)` - Create loyalty transaction
- `loyaltyRewards(args)` - List loyalty rewards
- `loyaltyTiers(args)` - List loyalty tiers
- `loyaltyPromotions(args)` - List loyalty promotions
- `loyaltyChallenges(args)` - List loyalty challenges

## Security Considerations

### Public Routes
- **Rate Limiting**: Should implement rate limiting to prevent abuse
- **Data Filtering**: Public queries should only return active/published items
- **Input Validation**: Strict validation on all public inputs
- **Guest Orders**: Track guest orders by session or require email

### Protected Routes
- **Role-Based Access**: Different roles have different permissions
- **Cafe-Level Access**: Users can only access data from cafes they belong to
- **Resource-Level Access**: Additional checks for specific resources (orders, inventory)

## Implementation Details

### Using @PublicAccess Decorator

```typescript
import { PublicAccess } from '../../middleware/role-access-control.middleware';

@Query(() => [Product])
@PublicAccess() // Marks this route as publicly accessible
async products(@Args('args') args?: ProductArgs): Promise<Product[]> {
  return this.productRepository.find(args);
}
```

### Using @UseGuards(PermGuard)

```typescript
import { PermGuard, ReqUser } from '@app/backend-authorization';

@Mutation(() => Product)
@UseGuards(PermGuard) // Requires authentication
async createMenuItem(
  @Args('input') input: ProductCreateInput,
  @ReqUser() user: User // User is guaranteed to be present
): Promise<Product> {
  // Implementation
}
```

## Recommended Enhancements

1. **Rate Limiting**: Implement rate limiting on public routes
2. **Guest Order Tracking**: Add session-based tracking for guest orders
3. **Email Verification**: Require email for guest orders
4. **Captcha**: Add captcha for order creation to prevent spam
5. **Logging**: Enhanced logging for public route usage
6. **Monitoring**: Track abuse patterns on public endpoints

## Testing Public Access

To test public routes without authentication:

```graphql
# This should work without authentication
query GetMenu {
  products(args: { where: { cafeId: "cafe-123", isActive: true } }) {
    id
    name
    description
    price
  }
}

# This should also work
query FindCafe {
  cafeByHostname(hostname: "mycafe.tabletap.com") {
    id
    name
    settings {
      theme
    }
  }
}

# Guest checkout
mutation CreateGuestOrder {
  createOrder(input: {
    cafeId: "cafe-123"
    items: [
      { productId: "prod-1", quantity: 2 }
    ]
    customerEmail: "guest@example.com"
  }) {
    id
    status
    total
  }
}
```

## Migration Notes

### Previous Behavior
- All routes required authentication (even menu viewing)
- Customers had to create accounts before browsing

### New Behavior
- Public routes allow browsing and guest checkout
- Authentication only required for admin operations
- Better user experience for customers
- Maintains security for sensitive operations
