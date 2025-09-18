# 🔌 TableTap API Reference

Complete API reference for the TableTap restaurant ordering system. This document covers GraphQL schema, WebSocket events, REST endpoints, and authentication.

## 📋 Table of Contents

- [GraphQL API](#-graphql-api)
- [WebSocket Events](#-websocket-events)
- [REST Endpoints](#-rest-endpoints)
- [Authentication](#-authentication)
- [Error Handling](#-error-handling)
- [Rate Limiting](#-rate-limiting)
- [Code Examples](#-code-examples)

## 🚀 GraphQL API

### Base URL
- **Development**: http://localhost:3000/graphql
- **Playground**: http://localhost:3000/graphql (GET request)

### Core Schema Types

#### Restaurant
```graphql
type Restaurant {
  id: ID!
  name: String!
  address: String!
  phone: String
  email: String
  website: String
  settings: RestaurantSettings!
  tables: [Table!]!
  menu: Menu!
  employees: [Employee!]!
  orders: [Order!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type RestaurantSettings {
  id: ID!
  currency: String!
  timezone: String!
  autoAcceptOrders: Boolean!
  preparationTimeMinutes: Int!
  orderingEnabled: Boolean!
  paymentMethods: [PaymentMethod!]!
}

input CreateRestaurantInput {
  name: String!
  address: String!
  phone: String
  email: String
  website: String
}
```

#### Menu System
```graphql
type Menu {
  id: ID!
  restaurant: Restaurant!
  categories: [MenuCategory!]!
  items: [MenuItem!]!
  isActive: Boolean!
  updatedAt: DateTime!
}

type MenuCategory {
  id: ID!
  name: String!
  description: String
  sortOrder: Int!
  isActive: Boolean!
  items: [MenuItem!]!
}

type MenuItem {
  id: ID!
  name: String!
  description: String
  price: Float!
  category: MenuCategory!
  isAvailable: Boolean!
  preparationTimeMinutes: Int
  allergens: [String!]!
  nutritionalInfo: NutritionalInfo
  images: [String!]!
  modifications: [ItemModification!]!
  tags: [String!]!
}

type ItemModification {
  id: ID!
  name: String!
  priceAdjustment: Float!
  isRequired: Boolean!
  options: [ModificationOption!]!
}

input CreateMenuItemInput {
  name: String!
  description: String
  price: Float!
  categoryId: ID!
  preparationTimeMinutes: Int = 15
  allergens: [String!] = []
  isAvailable: Boolean = true
}
```

#### Order Management
```graphql
type Order {
  id: ID!
  orderNumber: String!
  table: Table!
  customer: Customer
  items: [OrderItem!]!
  status: OrderStatus!
  totalAmount: Float!
  taxAmount: Float!
  tipAmount: Float
  specialInstructions: String
  estimatedReadyTime: DateTime
  actualReadyTime: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
  payments: [Payment!]!
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY_FOR_PICKUP
  SERVED
  COMPLETED
  CANCELLED
  REFUNDED
}

type OrderItem {
  id: ID!
  menuItem: MenuItem!
  quantity: Int!
  unitPrice: Float!
  totalPrice: Float!
  modifications: [AppliedModification!]!
  specialInstructions: String
}

type AppliedModification {
  id: ID!
  modification: ItemModification!
  selectedOptions: [ModificationOption!]!
  additionalCost: Float!
}

input CreateOrderInput {
  tableId: ID!
  customerId: ID
  items: [OrderItemInput!]!
  specialInstructions: String
}

input OrderItemInput {
  menuItemId: ID!
  quantity: Int!
  modifications: [AppliedModificationInput!] = []
  specialInstructions: String
}
```

#### Employee Management
```graphql
type Employee {
  id: ID!
  firstName: String!
  lastName: String!
  email: String!
  phone: String
  role: EmployeeRole!
  restaurant: Restaurant!
  isActive: Boolean!
  hireDate: Date!
  hourlyRate: Float
  shifts: [Shift!]!
  timeEntries: [TimeEntry!]!
  permissions: [Permission!]!
}

enum EmployeeRole {
  ADMIN
  MANAGER
  KITCHEN_STAFF
  WAIT_STAFF
  CASHIER
  HOST
}

type Shift {
  id: ID!
  employee: Employee!
  startTime: DateTime!
  endTime: DateTime!
  breakMinutes: Int!
  status: ShiftStatus!
  notes: String
}

enum ShiftStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

type TimeEntry {
  id: ID!
  employee: Employee!
  clockInTime: DateTime!
  clockOutTime: DateTime
  breakDuration: Int!
  totalHours: Float!
  location: String
  notes: String
}
```

#### Inventory Management
```graphql
type InventoryItem {
  id: ID!
  name: String!
  description: String
  category: String!
  unit: String!
  currentStock: Float!
  minimumStock: Float!
  maximumStock: Float
  costPerUnit: Float!
  supplier: Supplier
  expirationDate: Date
  location: String
  isActive: Boolean!
  lastUpdated: DateTime!
}

type Supplier {
  id: ID!
  name: String!
  contactPerson: String
  email: String
  phone: String
  address: String
  items: [InventoryItem!]!
  isActive: Boolean!
}

type StockAlert {
  id: ID!
  item: InventoryItem!
  alertType: AlertType!
  threshold: Float!
  currentLevel: Float!
  message: String!
  isResolved: Boolean!
  createdAt: DateTime!
}

enum AlertType {
  LOW_STOCK
  OUT_OF_STOCK
  EXPIRING_SOON
  EXPIRED
}
```

### Query Operations

```graphql
type Query {
  # Restaurant Operations
  restaurant(id: ID!): Restaurant
  restaurants: [Restaurant!]!
  restaurantBySlug(slug: String!): Restaurant

  # Menu Operations
  menu(restaurantId: ID!): Menu!
  menuItem(id: ID!): MenuItem
  menuCategories(restaurantId: ID!): [MenuCategory!]!
  availableItems(restaurantId: ID!): [MenuItem!]!

  # Order Operations
  order(id: ID!): Order
  orders(
    restaurantId: ID!
    status: OrderStatus
    tableId: ID
    dateFrom: DateTime
    dateTo: DateTime
    limit: Int = 50
    offset: Int = 0
  ): [Order!]!
  ordersByTable(tableId: ID!): [Order!]!
  pendingOrders(restaurantId: ID!): [Order!]!
  orderAnalytics(
    restaurantId: ID!
    dateFrom: DateTime!
    dateTo: DateTime!
  ): OrderAnalytics!

  # Employee Operations
  employee(id: ID!): Employee
  employees(restaurantId: ID!, role: EmployeeRole): [Employee!]!
  employeeShifts(
    employeeId: ID!
    dateFrom: Date!
    dateTo: Date!
  ): [Shift!]!
  timeEntries(
    employeeId: ID!
    dateFrom: Date!
    dateTo: Date!
  ): [TimeEntry!]!

  # Table Operations
  table(id: ID!): Table
  tables(restaurantId: ID!): [Table!]!
  tableByNumber(restaurantId: ID!, tableNumber: String!): Table

  # Inventory Operations
  inventoryItems(restaurantId: ID!): [InventoryItem!]!
  lowStockItems(restaurantId: ID!): [InventoryItem!]!
  stockAlerts(restaurantId: ID!, resolved: Boolean): [StockAlert!]!

  # Analytics
  salesAnalytics(
    restaurantId: ID!
    dateFrom: DateTime!
    dateTo: DateTime!
    groupBy: AnalyticsGroupBy = DAY
  ): SalesAnalytics!
  popularItems(
    restaurantId: ID!
    dateFrom: DateTime!
    dateTo: DateTime!
    limit: Int = 10
  ): [PopularItemStat!]!
  employeePerformance(
    restaurantId: ID!
    dateFrom: DateTime!
    dateTo: DateTime!
  ): [EmployeePerformanceStat!]!
}
```

### Mutation Operations

```graphql
type Mutation {
  # Restaurant Management
  createRestaurant(input: CreateRestaurantInput!): Restaurant!
  updateRestaurant(id: ID!, input: UpdateRestaurantInput!): Restaurant!
  updateRestaurantSettings(
    restaurantId: ID!
    input: RestaurantSettingsInput!
  ): RestaurantSettings!

  # Menu Management
  createMenuItem(input: CreateMenuItemInput!): MenuItem!
  updateMenuItem(id: ID!, input: UpdateMenuItemInput!): MenuItem!
  updateMenuItemAvailability(id: ID!, isAvailable: Boolean!): MenuItem!
  deleteMenuItem(id: ID!): Boolean!

  createMenuCategory(input: CreateMenuCategoryInput!): MenuCategory!
  updateMenuCategory(id: ID!, input: UpdateMenuCategoryInput!): MenuCategory!
  reorderMenuCategories(categoryIds: [ID!]!): [MenuCategory!]!

  # Order Management
  createOrder(input: CreateOrderInput!): Order!
  updateOrderStatus(id: ID!, status: OrderStatus!): Order!
  addItemToOrder(orderId: ID!, item: OrderItemInput!): Order!
  removeItemFromOrder(orderId: ID!, itemId: ID!): Order!
  updateOrderItem(
    orderId: ID!
    itemId: ID!
    input: UpdateOrderItemInput!
  ): Order!
  cancelOrder(id: ID!, reason: String): Order!

  # Employee Management
  createEmployee(input: CreateEmployeeInput!): Employee!
  updateEmployee(id: ID!, input: UpdateEmployeeInput!): Employee!
  deactivateEmployee(id: ID!): Employee!

  createShift(input: CreateShiftInput!): Shift!
  updateShift(id: ID!, input: UpdateShiftInput!): Shift!

  clockIn(employeeId: ID!, location: String): TimeEntry!
  clockOut(timeEntryId: ID!): TimeEntry!
  addBreak(timeEntryId: ID!, minutes: Int!): TimeEntry!

  # Inventory Management
  createInventoryItem(input: CreateInventoryItemInput!): InventoryItem!
  updateInventoryItem(id: ID!, input: UpdateInventoryItemInput!): InventoryItem!
  adjustInventoryStock(id: ID!, adjustment: Float!, reason: String!): InventoryItem!
  recordInventoryUsage(items: [InventoryUsageInput!]!): [InventoryItem!]!

  resolveStockAlert(id: ID!): StockAlert!

  # Table Management
  createTable(input: CreateTableInput!): Table!
  updateTable(id: ID!, input: UpdateTableInput!): Table!
  generateTableQRCode(tableId: ID!): QRCode!

  # Payment Processing
  processPayment(input: PaymentInput!): PaymentResult!
  refundPayment(paymentId: ID!, amount: Float, reason: String): RefundResult!

  # System Operations
  sendTestNotification(message: String!): Boolean!
  generateReport(type: ReportType!, params: ReportParams!): ReportResult!
}
```

### Subscription Operations

```graphql
type Subscription {
  # Order Updates
  orderStatusChanged(restaurantId: ID!): Order!
  newOrder(restaurantId: ID!): Order!
  orderCompleted(restaurantId: ID!): Order!
  orderCancelled(restaurantId: ID!): Order!

  # Kitchen Notifications
  kitchenOrderUpdate(restaurantId: ID!): KitchenNotification!
  orderReadyForService(restaurantId: ID!): Order!
  preparationTimeAlert(restaurantId: ID!): PreparationAlert!

  # Inventory Alerts
  lowStockAlert(restaurantId: ID!): StockAlert!
  inventoryUpdated(restaurantId: ID!): InventoryItem!
  expirationAlert(restaurantId: ID!): ExpirationAlert!

  # Employee Events
  employeeClockedIn(restaurantId: ID!): Employee!
  employeeClockedOut(restaurantId: ID!): Employee!
  shiftStarted(restaurantId: ID!): Shift!
  shiftEnded(restaurantId: ID!): Shift!

  # System Events
  systemAlert(restaurantId: ID!): SystemAlert!
  dataExportReady(userId: ID!): ExportNotification!
}
```

## 🔄 WebSocket Events

### Connection
```typescript
// Client connection
const socket = io('ws://localhost:3000/orders', {
  auth: {
    token: 'Bearer jwt_token_here'
  }
});
```

### Order Events
```typescript
// Client to Server
socket.emit('join:restaurant', { restaurantId: 'restaurant_uuid' });
socket.emit('join:kitchen', { restaurantId: 'restaurant_uuid' });
socket.emit('join:table', { tableId: 'table_uuid' });

socket.emit('order:status-update', {
  orderId: 'order_uuid',
  status: 'PREPARING',
  estimatedTime: 15 // minutes
});

socket.emit('order:item-ready', {
  orderId: 'order_uuid',
  itemId: 'item_uuid'
});

// Server to Client
socket.on('order:created', (order: Order) => {
  console.log('New order received:', order);
});

socket.on('order:status-changed', (update) => {
  console.log('Order status updated:', update);
});

socket.on('kitchen:new-order', (order: Order) => {
  console.log('Kitchen received new order:', order);
});
```

### Kitchen Events
```typescript
socket.on('kitchen:queue-updated', (data) => {
  console.log('Kitchen queue:', data);
  // data: { pending: Order[], inProgress: Order[], ready: Order[] }
});

socket.on('kitchen:timer-alert', (alert) => {
  console.log('Timer alert:', alert);
  // alert: { orderId: string, timeElapsed: number, urgency: 'warning' | 'critical' }
});
```

### Inventory Events
```typescript
socket.on('inventory:low-stock', (alert) => {
  console.log('Low stock alert:', alert);
});

socket.on('inventory:item-updated', (item) => {
  console.log('Inventory updated:', item);
});
```

## 🌐 REST Endpoints

### Authentication
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@restaurant.com",
  "password": "password123"
}

Response:
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600,
  "user": {
    "id": "user_uuid",
    "email": "user@restaurant.com",
    "role": "MANAGER"
  }
}
```

### File Upload
```http
POST /upload/menu-images
Content-Type: multipart/form-data
Authorization: Bearer jwt_token

Form Data:
- file: [image file]
- menuItemId: menu_item_uuid

Response:
{
  "id": "file_uuid",
  "url": "https://cdn.example.com/images/menu-item.jpg",
  "filename": "burger.jpg",
  "mimeType": "image/jpeg",
  "size": 204800
}
```

### Health Checks
```http
GET /health

Response:
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "external_services": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "external_services": { "status": "up" }
  }
}
```

### QR Code Generation
```http
POST /qr-codes/table
Content-Type: application/json
Authorization: Bearer jwt_token

{
  "tableId": "table_uuid",
  "size": 200,
  "format": "png"
}

Response:
{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "url": "https://app.tabletap.com/table/table_uuid",
  "expires": "2024-12-31T23:59:59Z"
}
```

## 🔐 Authentication

### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string;          // User ID
  email: string;        // User email
  role: UserRole;       // User role
  restaurantId: string; // Associated restaurant
  permissions: string[]; // Specific permissions
  iat: number;          // Issued at
  exp: number;          // Expiration
}
```

### Auth0 Integration
```typescript
// Frontend (Angular)
import { AuthService } from '@auth0/auth0-angular';

constructor(private auth: AuthService) {}

login() {
  this.auth.loginWithRedirect();
}

logout() {
  this.auth.logout({ returnTo: window.location.origin });
}

// Backend (NestJS)
@UseGuards(AuthGuard)
@Get('profile')
getProfile(@User() user: JWTPayload) {
  return user;
}
```

### Role-Based Access Control
```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  RESTAURANT_ADMIN = 'restaurant_admin',
  MANAGER = 'manager',
  KITCHEN_STAFF = 'kitchen_staff',
  WAIT_STAFF = 'wait_staff',
  CUSTOMER = 'customer'
}

// Permission decorator
@Permissions('orders:manage')
@UseGuards(AuthGuard, PermissionsGuard)
updateOrder(@Args('id') id: string) {
  // Only users with 'orders:manage' permission can access
}
```

## ⚠️ Error Handling

### GraphQL Errors
```typescript
enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

// Error response format
{
  "errors": [
    {
      "message": "Order not found",
      "code": "NOT_FOUND",
      "path": ["order"],
      "extensions": {
        "code": "NOT_FOUND",
        "timestamp": "2024-01-01T12:00:00Z",
        "traceId": "abc-123",
        "details": {
          "orderId": "invalid_order_id"
        }
      }
    }
  ]
}
```

### HTTP Status Codes
- `200 OK` - Successful operation
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - External service unavailable

## 🚦 Rate Limiting

### API Rate Limits
- **Anonymous requests**: 100 requests per hour
- **Authenticated requests**: 1000 requests per hour
- **GraphQL queries**: 500 requests per hour
- **File uploads**: 50 requests per hour
- **WebSocket connections**: 10 concurrent connections per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
X-RateLimit-Window: 3600
```

## 💻 Code Examples

### Frontend (Angular)

#### GraphQL Query
```typescript
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

const GET_ORDERS = gql`
  query GetOrders($restaurantId: ID!, $status: OrderStatus) {
    orders(restaurantId: $restaurantId, status: $status) {
      id
      orderNumber
      status
      totalAmount
      table {
        number
      }
      items {
        id
        quantity
        menuItem {
          name
          price
        }
      }
      createdAt
    }
  }
`;

@Injectable()
export class OrderService {
  constructor(private apollo: Apollo) {}

  getOrders(restaurantId: string, status?: OrderStatus) {
    return this.apollo.watchQuery({
      query: GET_ORDERS,
      variables: { restaurantId, status }
    }).valueChanges;
  }
}
```

#### GraphQL Mutation
```typescript
const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      orderNumber
      status
      totalAmount
    }
  }
`;

createOrder(orderData: CreateOrderInput) {
  return this.apollo.mutate({
    mutation: CREATE_ORDER,
    variables: { input: orderData },
    update: (cache, { data }) => {
      // Update Apollo cache
      const existingOrders = cache.readQuery({
        query: GET_ORDERS,
        variables: { restaurantId: orderData.restaurantId }
      });

      cache.writeQuery({
        query: GET_ORDERS,
        variables: { restaurantId: orderData.restaurantId },
        data: {
          orders: [data.createOrder, ...existingOrders.orders]
        }
      });
    }
  });
}
```

#### WebSocket Integration
```typescript
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable()
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('ws://localhost:3000/orders', {
      auth: {
        token: localStorage.getItem('access_token')
      }
    });
  }

  joinKitchen(restaurantId: string) {
    this.socket.emit('join:kitchen', { restaurantId });
  }

  onNewOrder(callback: (order: Order) => void) {
    this.socket.on('order:created', callback);
  }

  updateOrderStatus(orderId: string, status: OrderStatus) {
    this.socket.emit('order:status-update', { orderId, status });
  }
}
```

### Backend (NestJS)

#### GraphQL Resolver
```typescript
import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

@Resolver(() => Order)
export class OrderResolver {
  constructor(
    private orderService: OrderService,
    private pubSub: PubSub
  ) {}

  @Query(() => [Order])
  @UseGuards(AuthGuard)
  orders(
    @Args('restaurantId') restaurantId: string,
    @Args('status', { nullable: true }) status?: OrderStatus
  ): Promise<Order[]> {
    return this.orderService.findAll(restaurantId, status);
  }

  @Mutation(() => Order)
  @UseGuards(AuthGuard)
  @Permissions('orders:create')
  async createOrder(
    @Args('input') input: CreateOrderInput
  ): Promise<Order> {
    const order = await this.orderService.create(input);

    // Publish real-time notification
    await this.pubSub.publish('orderCreated', { orderCreated: order });

    return order;
  }

  @Subscription(() => Order)
  orderCreated(@Args('restaurantId') restaurantId: string) {
    return this.pubSub.asyncIterator('orderCreated');
  }
}
```

#### WebSocket Gateway
```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/orders',
  cors: { origin: '*' }
})
export class OrderGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join:kitchen')
  handleJoinKitchen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId: string }
  ) {
    client.join(`kitchen-${data.restaurantId}`);
    return { status: 'joined', room: `kitchen-${data.restaurantId}` };
  }

  @SubscribeMessage('order:status-update')
  async handleOrderStatusUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; status: OrderStatus }
  ) {
    // Update order in database
    const order = await this.orderService.updateStatus(data.orderId, data.status);

    // Broadcast to kitchen
    this.server.to(`kitchen-${order.restaurant.id}`).emit('order:status-changed', {
      orderId: data.orderId,
      status: data.status,
      timestamp: new Date()
    });

    // Notify table
    this.server.to(`table-${order.table.id}`).emit('order:updated', order);

    return { success: true };
  }
}
```

#### Service Layer
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>
  ) {}

  async findAll(restaurantId: string, status?: OrderStatus): Promise<Order[]> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      .where('table.restaurantId = :restaurantId', { restaurantId });

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    return query
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async create(input: CreateOrderInput): Promise<Order> {
    const order = this.orderRepository.create({
      ...input,
      orderNumber: await this.generateOrderNumber(),
      status: OrderStatus.PENDING
    });

    await this.orderRepository.save(order);

    // Calculate total amount
    await this.calculateOrderTotal(order.id);

    return this.findOne(order.id);
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    await this.orderRepository.update(orderId, {
      status,
      ...(status === OrderStatus.READY_FOR_PICKUP && {
        actualReadyTime: new Date()
      })
    });

    return this.findOne(orderId);
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.orderRepository.count({
      where: {
        createdAt: Between(
          new Date(date.setHours(0, 0, 0, 0)),
          new Date(date.setHours(23, 59, 59, 999))
        )
      }
    });

    return `${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
  }
}
```

---

This API reference provides comprehensive documentation for integrating with the TableTap system. For additional examples and advanced usage patterns, refer to the [Comprehensive Project Documentation](./COMPREHENSIVE_PROJECT_DOCUMENTATION.md).

**Need Help?**
- 🐛 [Report API Issues](https://github.com/cskiwi/table-tap/issues)
- 💬 [API Discussions](https://github.com/cskiwi/table-tap/discussions)
- 📧 [Technical Support](mailto:api-support@tabletap.com)