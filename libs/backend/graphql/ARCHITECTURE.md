# GraphQL Backend Architecture

## Core Principles

### 1. Services are for Business Logic, NOT Database CRUD

**Services MUST NOT:**
- ❌ Depend on GraphQL layer (no imports from `@app/backend-graphql`)
- ❌ Accept GraphQL input types as parameters
- ❌ Perform simple database CRUD operations
- ❌ Wrap repository calls without adding logic

**Services MUST:**
- ✅ Define their own input types (independent of GraphQL)
- ✅ Contain validation, calculations, and complex business rules
- ✅ Work with model/entity types only
- ✅ Be reusable across different presentation layers (GraphQL, REST, etc.)

### 2. Resolvers Transform and Orchestrate

**Resolvers are responsible for:**
- ✅ Transforming GraphQL inputs into service inputs
- ✅ Calling repositories directly for simple CRUD
- ✅ Calling services only when business logic is needed
- ✅ Publishing GraphQL subscriptions
- ✅ Handling presentation layer concerns (caching, dataloaders)

### Data Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       v
┌─────────────────────────────────────────┐
│          GraphQL Resolvers              │
│  (Orchestration & Presentation Layer)   │
└─────┬───────────────────┬───────────────┘
      │                   │
      v                   v
┌─────────────┐     ┌─────────────────────┐
│ Repository  │     │  Service (Logic)    │
│   (CRUD)    │     │  - Validation       │
│             │     │  - Calculations     │
│             │     │  - Complex Business │
│             │     │    Rules            │
└─────────────┘     └─────────────────────┘
      │                   │
      └────────┬──────────┘
               v
        ┌────────────┐
        │  Database  │
        └────────────┘
```

## When to Use What

### ✅ Use Repository Directly (in Resolvers)

**Simple CRUD Operations:**
- Reading a single entity by ID
- Listing entities with basic filters (cafeId, status, etc.)
- Simple updates (changing a field value)
- Simple deletes

**Example:**
```typescript
@Query(() => [Stock])
async inventory(@Args('cafeId') cafeId: string): Promise<Stock[]> {
  // Simple read - use repository directly
  return await this.inventoryRepository.find({
    where: { cafeId },
    order: { product: { name: 'ASC' } }
  });
}
```

### ✅ Use Service (Business Logic)

**Complex Operations:**
- Validation logic (SKU uniqueness, stock constraints)
- Cross-entity operations (order creation affecting inventory)
- Calculations (alerts, forecasting, analytics)
- Workflow management (order status transitions)
- Payment processing
- Notification triggers

**Example:**
```typescript
@Mutation(() => Stock)
async createInventoryItem(
  @Args('input') input: CreateInventoryItemInput,
  @ReqUser() user: User,
): Promise<Stock> {
  // Complex creation with validation - use service
  return await this.inventoryService.createItem(input, user);
}
```

## Service Responsibilities

### InventoryService

**What it SHOULD do:**
- ✅ Validate new inventory items (SKU uniqueness, constraint checks)
- ✅ Generate stock alerts (low stock, expiring items)
- ✅ Calculate forecasts and analytics
- ✅ Handle complex stock updates (with transaction management)
- ✅ Manage supplier information
- ✅ Track stock movements for audit trails

**What it should NOT do:**
- ❌ Simple findById, findByCafe (use repository)
- ❌ Basic list/search operations (use repository)
- ❌ Simple field updates (use repository)

### OrderService

**What it SHOULD do:**
- ✅ Create orders (validation, inventory deduction, counter assignment)
- ✅ Process payments (integration with payment providers)
- ✅ Update order status (workflow validation, inventory restoration)
- ✅ Cancel orders (inventory restoration, refund handling)
- ✅ Generate analytics and reports

**What it should NOT do:**
- ❌ Simple findById, findByOrderNumber (use repository)
- ❌ Basic list operations (findByCafe, findByCustomer) (use repository)
- ❌ Simple field updates without business logic (use repository)

## Benefits of This Architecture

1. **Performance**: Skip service layer for simple operations = less overhead
2. **Clarity**: Business logic is clearly separated in services
3. **Testability**: Services only contain logic worth testing
4. **Maintainability**: Easier to see what requires complex handling vs. simple CRUD
5. **Flexibility**: GraphQL resolvers can optimize queries directly against database

## Migration Guide

### Before (Wrong Pattern)
```typescript
// ❌ Service wrapping simple repository call
class InventoryService {
  async findById(id: string): Promise<Stock | null> {
    return this.inventoryRepository.findOne({ where: { id } });
  }
}

// Resolver unnecessarily calling service
class InventoryResolver {
  @Query(() => Stock)
  async inventoryItem(@Args('id') id: string): Promise<Stock | null> {
    return this.inventoryService.findById(id);
  }
}
```

### After (Correct Pattern)
```typescript
// ✅ Service only has business logic
class InventoryService {
  // Only methods with validation, calculations, complex logic
  public getStockAlerts(items: Stock[]): StockAlert[] {
    // Complex alert generation logic
  }
}

// Resolver reads directly from repository
class InventoryResolver {
  @Query(() => Stock)
  async inventoryItem(@Args('id') id: string): Promise<Stock | null> {
    // Simple read - go straight to repository
    return await this.inventoryRepository.findOne({ where: { id } });
  }
}
```

## Key Principles

1. **Repository for data access** - All database operations go through repositories
2. **Service for business rules** - Validation, calculations, complex workflows
3. **Resolver for orchestration** - Coordinates between repository and service calls
4. **Keep it simple** - Don't add abstraction layers unnecessarily

## Examples

### Reading Data (Use Repository)
```typescript
// Low stock items with business rule query
@Query(() => [Stock])
async lowStockItems(@Args('cafeId') cafeId: string): Promise<Stock[]> {
  return await this.inventoryRepository
    .createQueryBuilder('inventory')
    .where('inventory.cafeId = :cafeId', { cafeId })
    .andWhere('inventory.currentQuantity <= inventory.minimumStock')
    .andWhere('inventory.status = :status', { status: 'ACTIVE' })
    .orderBy('inventory.currentQuantity', 'ASC')
    .getMany();
}
```

### Complex Operations (Use Service)
```typescript
// Order creation with validation, inventory checks, payment
@Mutation(() => Order)
async createOrder(
  @Args('input') input: CreateOrderInput,
  @ReqUser() user: User,
): Promise<Order> {
  // Complex business logic - use service
  return await this.orderService.create(input, user);
}
```

### Hybrid Approach (Use Both)
```typescript
// Update stock then generate alerts
@Mutation(() => Stock)
async updateInventoryStock(
  @Args('id') id: string,
  @Args('input') input: UpdateInventoryStockInput,
): Promise<Stock> {
  // Service handles update with validation
  const item = await this.inventoryService.updateStock(id, input, user);

  // Service provides alert generation (business logic)
  const alerts = await this.inventoryService.getStockAlerts([item]);

  // Resolver handles publishing (presentation layer concern)
  for (const alert of alerts) {
    await this.pubSub.publish('stockAlert', alert);
  }

  return item;
}
```
