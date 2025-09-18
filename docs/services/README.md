# Angular Service Architecture for Restaurant Ordering System

## Overview

This document describes the comprehensive Angular service architecture designed for the restaurant ordering system. The architecture provides a robust, scalable, and maintainable foundation for managing data, real-time communications, authentication, state management, and third-party integrations.

## Architecture Overview

```
Frontend Services Architecture
├── Core Services
│   ├── BaseService (HTTP/GraphQL foundation)
│   └── Types (TypeScript interfaces)
├── Data Services
│   ├── OrderService (Order management)
│   ├── ProductService (Menu/inventory)
│   ├── PaymentService (Payment processing)
│   ├── EmployeeService (Staff management)
│   ├── InventoryService (Stock management)
│   └── CafeService (Multi-tenant config)
├── Real-time Services
│   ├── WebSocketService (Socket.io integration)
│   ├── OrderStreamService (Live order updates)
│   ├── NotificationService (Push notifications)
│   └── InventoryAlertService (Stock alerts)
├── Authentication & Security
│   ├── AuthService (JWT + Auth0)
│   ├── RoleGuardService (Permission-based access)
│   └── SecurityService (XSS/CSRF protection)
├── State Management
│   ├── AppStateService (Global state)
│   ├── OrderStateService (Cart/order state)
│   └── CacheService (Offline storage)
├── Integration Services
│   ├── PaymentGatewayService (Multiple providers)
│   ├── BarcodeService (Capacitor integration)
│   └── PrinterService (Receipt printing)
└── Utility Services
    ├── ErrorHandlerService (Global error handling)
    ├── LoggingService (Structured logging)
    └── AnalyticsService (Performance tracking)
```

## Core Services

### BaseService

The foundation service that all data services extend from. Provides:

- **HTTP Client Integration**: RESTful API communication
- **GraphQL Apollo Client**: Query and mutation handling
- **Error Handling**: Standardized error processing
- **Caching**: Intelligent cache management
- **Retry Logic**: Automatic retry with exponential backoff
- **Loading States**: Observable loading indicators

```typescript
// Example usage
export class OrderService extends BaseService {
  getOrders(): Observable<Order[]> {
    return this.query(GET_ORDERS_QUERY, {}, { useCache: true });
  }
}
```

### Type System

Comprehensive TypeScript interfaces ensuring type safety across the application:

- **Core Entities**: Order, Product, User, Payment, etc.
- **API Responses**: Standardized response wrappers
- **State Interfaces**: Application state typing
- **Configuration Types**: Service configuration interfaces

## Data Services

### OrderService

Manages restaurant orders with real-time capabilities:

**Features:**
- Order CRUD operations
- Real-time order status updates
- Shopping cart management
- Order statistics and reporting
- Kitchen display integration

**Key Methods:**
```typescript
getOrders(cafeId: string, options?: PaginationOptions): Observable<Order[]>
createOrder(input: CreateOrderInput): Observable<Order>
updateOrderStatus(id: string, status: OrderStatus): Observable<Order>
addToCart(product: Product, quantity: number): void
createOrderFromCart(cafeId: string, orderType: OrderType): Observable<Order>
```

### ProductService

Handles menu items and product catalog:

**Features:**
- Product catalog management
- Category-based filtering
- Search functionality
- Availability management
- Dietary requirement filtering
- Price calculation with customizations

**Key Methods:**
```typescript
getProducts(cafeId: string, options?: ProductFilters): Observable<Product[]>
searchProducts(cafeId: string, search: string): Observable<Product[]>
updateProductAvailability(id: string, isAvailable: boolean): Observable<Product>
getProductsByDiet(requirements: DietaryRequirements): Observable<Product[]>
```

### PaymentService

Comprehensive payment processing:

**Features:**
- Multiple payment methods (Card, Cash, Digital Wallet, QR Code)
- Apple Pay and Google Pay integration
- QR code payment generation
- Payment gateway abstraction
- Refund processing
- Fee calculation

**Key Methods:**
```typescript
processCardPayment(order: Order, cardDetails: CardDetails): Observable<PaymentResult>
generateQRCodePayment(orderId: string, amount: number): Observable<QRCodePayment>
initiateApplePayPayment(order: Order): Observable<PaymentResult>
refundPayment(paymentId: string, amount?: number): Observable<Payment>
```

## Real-time Services

### WebSocketService

Socket.io integration for real-time communication:

**Features:**
- Automatic connection management
- Room-based messaging
- Reconnection handling
- Message type routing
- Connection health monitoring

**Key Methods:**
```typescript
connect(config: ConnectionConfig, userContext: UserContext): Observable<boolean>
emit(event: string, data: any): void
on<T>(event: string): Observable<T>
joinCafeRoom(cafeId: string): void
updateOrderStatus(orderId: string, status: OrderStatus): void
```

**Real-time Events:**
- `order_update`: Order status changes
- `inventory_alert`: Stock level warnings
- `notification`: System notifications
- `kitchen_display`: Kitchen order updates

## Authentication & Security

### AuthService

Auth0 integration with role-based access control:

**Features:**
- Auth0 integration
- JWT token management
- Role-based permissions
- User profile management
- Session validation
- Biometric authentication (Capacitor)

**Key Methods:**
```typescript
login(credentials: LoginCredentials): Observable<boolean>
logout(): Observable<boolean>
getUserProfile(): Observable<User>
hasPermission(permission: string): Observable<boolean>
hasRole(role: UserRole): Observable<boolean>
canAccessCafe(cafeId: string): Observable<boolean>
```

**Security Features:**
- **JWT Token Refresh**: Automatic token renewal
- **Role Guards**: Route protection based on user roles
- **Permission System**: Granular access control
- **Session Management**: Secure session handling

## State Management

### AppStateService

Centralized application state management:

**Features:**
- Reactive state updates
- State persistence
- Offline state handling
- Cross-component communication
- State debugging utilities

**State Modules:**
- **Auth State**: User authentication status
- **Order State**: Current orders and cart
- **Product State**: Menu and categories
- **Inventory State**: Stock levels and alerts
- **UI State**: Theme, notifications, loading
- **Offline State**: Network status and pending actions

**Key Methods:**
```typescript
updateAuthState(updates: Partial<AuthState>): void
setCurrentOrder(order: Order): void
addToCart(item: OrderItem): void
setTheme(theme: 'light' | 'dark'): void
addNotification(notification: NotificationMessage): void
```

## Integration Services

### Third-party Integrations

**Payment Gateways:**
- Stripe integration
- PayPal support
- Apple Pay/Google Pay
- Square integration

**Hardware Integration (Capacitor):**
- Barcode scanning
- Receipt printing
- Biometric authentication
- Camera access for QR codes
- Geolocation services

**Cloud Services:**
- Firebase Push Notifications
- AWS S3 for image storage
- Redis for caching
- WebSocket real-time updates

## Error Handling & Logging

### ErrorHandlerService

Global error handling with comprehensive reporting:

**Features:**
- Global error catching
- Error classification (Critical, High, Medium, Low)
- User-friendly error messages
- Remote error reporting
- Error recovery suggestions
- Performance impact tracking

**Error Types:**
- **HTTP Errors**: API communication failures
- **GraphQL Errors**: Query/mutation failures
- **JavaScript Errors**: Runtime exceptions
- **Network Errors**: Connectivity issues
- **Authentication Errors**: Auth failures

## Performance Optimization

### Caching Strategy

**Multi-level Caching:**
- **Memory Cache**: Immediate data access
- **HTTP Cache**: Browser-level caching
- **Apollo Cache**: GraphQL query caching
- **Service Worker**: Offline data access

**Cache Invalidation:**
- Time-based expiration
- Event-driven invalidation
- Manual cache clearing
- Selective cache updates

### Offline Support

**Offline Capabilities:**
- Service Worker integration
- Local data storage
- Action queuing
- Automatic synchronization
- Offline indicators

## Testing Strategy

### Service Testing

**Unit Testing:**
```typescript
describe('OrderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        { provide: Apollo, useValue: mockApollo },
        { provide: HttpClient, useValue: mockHttp }
      ]
    });
  });

  it('should create order', async () => {
    const service = TestBed.inject(OrderService);
    const order = await service.createOrder(mockOrderInput).toPromise();
    expect(order).toBeDefined();
    expect(order.status).toBe(OrderStatus.PENDING);
  });
});
```

**Integration Testing:**
- WebSocket connection testing
- Payment gateway testing
- Auth0 integration testing
- Real-time event testing

**Mocking Utilities:**
- Service mocks for testing
- GraphQL operation mocking
- WebSocket event simulation
- Payment gateway simulation

## Configuration

### Environment Configuration

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  graphqlUrl: 'http://localhost:3000/graphql',
  websocketUrl: 'http://localhost:3000',
  auth0: {
    domain: 'your-auth0-domain',
    clientId: 'your-client-id',
    audience: 'your-api-audience'
  },
  stripe: {
    publishableKey: 'pk_test_...'
  },
  features: {
    enableOfflineMode: true,
    enableAnalytics: true,
    enablePushNotifications: true
  }
};
```

### Service Configuration

```typescript
// In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // HTTP and GraphQL
    provideHttpClient(withInterceptorsFromDi()),
    provideGraphQL(),

    // Authentication
    importProvidersFrom(AuthModule.forRoot(auth0Config)),

    // Error Handling
    { provide: ErrorHandler, useClass: ErrorHandlerService },

    // Service Configuration
    { provide: SERVICE_CONFIG, useValue: serviceConfig }
  ]
};
```

## Usage Examples

### Order Management Flow

```typescript
@Component({
  template: `
    <div *ngFor="let order of orders$ | async">
      <order-card
        [order]="order"
        (statusChange)="updateOrderStatus($event)">
      </order-card>
    </div>
  `
})
export class KitchenDisplayComponent {
  orders$ = this.orderService.getPreparingOrders(this.cafeId);

  constructor(
    private orderService: OrderService,
    private websocket: WebSocketService
  ) {
    // Subscribe to real-time order updates
    this.websocket.subscribeToOrderUpdates()
      .subscribe(update => {
        this.orderService.handleOrderUpdate(update);
      });
  }

  updateOrderStatus(event: { orderId: string; status: OrderStatus }) {
    this.orderService.updateOrderStatus(event.orderId, event.status)
      .subscribe(order => {
        console.log('Order updated:', order);
      });
  }
}
```

### Shopping Cart Implementation

```typescript
@Component({
  template: `
    <div class="cart">
      <div *ngFor="let item of cartItems$ | async">
        <cart-item
          [item]="item"
          (quantityChange)="updateQuantity($event)"
          (remove)="removeItem($event)">
        </cart-item>
      </div>
      <div class="total">Total: {{ cartTotal$ | async | currency }}</div>
      <button (click)="checkout()" [disabled]="(cartItemCount$ | async) === 0">
        Checkout
      </button>
    </div>
  `
})
export class ShoppingCartComponent {
  cartItems$ = this.orderService.cartItems$;
  cartTotal$ = this.orderService.cartTotal$;
  cartItemCount$ = this.orderService.cartItemCount$;

  constructor(private orderService: OrderService) {}

  updateQuantity(event: { itemId: string; quantity: number }) {
    this.orderService.updateCartItemQuantity(event.itemId, event.quantity);
  }

  removeItem(itemId: string) {
    this.orderService.removeFromCart(itemId);
  }

  checkout() {
    this.orderService.createOrderFromCart(
      this.cafeId,
      OrderType.DINE_IN
    ).subscribe(order => {
      console.log('Order created:', order);
    });
  }
}
```

## Best Practices

### Service Development

1. **Extend BaseService**: All data services should extend BaseService
2. **Use TypeScript**: Leverage strong typing throughout
3. **Handle Errors**: Implement comprehensive error handling
4. **Cache Appropriately**: Use caching for frequently accessed data
5. **Observable Patterns**: Use RxJS operators effectively
6. **Test Coverage**: Write comprehensive unit and integration tests

### State Management

1. **Centralized State**: Use AppStateService for global state
2. **Immutable Updates**: Always create new state objects
3. **Selective Subscriptions**: Subscribe only to needed state slices
4. **State Persistence**: Persist important state to localStorage
5. **State Debugging**: Use state snapshots for debugging

### Real-time Integration

1. **Connection Management**: Handle connection failures gracefully
2. **Room Management**: Join/leave rooms appropriately
3. **Message Routing**: Route messages to correct handlers
4. **Offline Handling**: Queue actions when offline
5. **Performance**: Optimize message frequency

This architecture provides a solid foundation for building a scalable, maintainable restaurant ordering system with real-time capabilities, comprehensive state management, and robust error handling.