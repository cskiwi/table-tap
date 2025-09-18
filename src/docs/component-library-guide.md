# Angular Component Library Guide - Restaurant Ordering System

## Overview

This comprehensive Angular component library is built using **PrimeNG** and **Tailwind CSS** for the TableTap restaurant ordering system. The library follows Angular best practices and provides a complete set of components for restaurant management across customer interfaces, kitchen operations, employee management, and administrative functions.

## Technology Stack

- **Angular 20.2.4** - Latest Angular framework with SSR support
- **PrimeNG 20.1.1** - UI component library with 80+ components
- **PrimeIcons 7.0.0** - Icon library with 250+ icons
- **Tailwind CSS** - Utility-first CSS framework
- **@primeuix/themes** - Advanced theming system
- **Apollo GraphQL** - Data management and API integration
- **Socket.io** - Real-time communication
- **Auth0** - Authentication and authorization
- **PWA Support** - Progressive web app capabilities

## Architecture

### Base Component System

All components extend from `BaseComponent` which provides:

```typescript
// Core functionality
- Lifecycle management (OnInit, OnDestroy)
- Loading and error state management
- Responsive breakpoint utilities
- Accessibility helpers (ARIA labels, keyboard navigation)
- Unsubscription management
- Theme and configuration handling
```

### Component Categories

#### 1. **Shared Components** (Cross-module reusability)
- **BaseComponent** - Foundation class for all components
- **Common interfaces** - Unified data types and contracts

#### 2. **Customer Interface Components**
- **OrderCard** - Order display with real-time status
- **ProductGrid** - Menu browsing with advanced filtering
- **PaymentDialog** - Multi-method payment processing

#### 3. **Kitchen/Counter Components**
- **CounterDashboard** - Real-time order management system

#### 4. **Employee Management**
- **EmployeeTimeTracker** - Time tracking and scheduling

#### 5. **Administrative Components**
- **InventoryTable** - Stock management with alerts
- **AnalyticsDashboard** - Business intelligence and reporting

#### 6. **Utility Components**
- **QRCodeGenerator** - Payment and table QR codes
- **NotificationToast** - Real-time system notifications

## Component Specifications

### OrderCard Component

**Purpose**: Display order information with status management and action controls

```typescript
// Key Features
- Real-time status updates
- Progress visualization
- Action buttons based on order state
- Customer information display
- Item breakdown with customizations
- Payment method indicators
- Estimated delivery times
- Responsive design (mobile-first)

// Usage
<app-order-card
  [order]="orderData"
  [showActions]="true"
  [compact]="false"
  (statusChange)="handleStatusChange($event)"
  (viewDetails)="viewOrderDetails($event)">
</app-order-card>
```

**Styling**: Uses PrimeNG Card with Tailwind utilities for responsive design, status-based color coding, and smooth animations.

### ProductGrid Component

**Purpose**: Menu display with advanced filtering, search, and categorization

```typescript
// Key Features
- Advanced filtering (category, price, dietary restrictions)
- Search functionality
- Grid/List view toggle
- Pagination support
- Product customization detection
- Real-time availability updates
- Responsive grid layout
- Loading states with skeleton screens

// Configuration
interface ProductGridConfig {
  showFilters: boolean;
  showSearch: boolean;
  layout: 'grid' | 'list';
  itemsPerRow: number;
  showPagination: boolean;
  itemsPerPage: number;
}
```

**Integration**: Uses PrimeNG DataView with custom filter components and responsive Tailwind grid system.

### PaymentDialog Component

**Purpose**: Comprehensive payment processing with multiple payment methods

```typescript
// Supported Payment Methods
- Cash payments
- Credit/Debit cards
- Mobile payments (Apple Pay, Google Pay)
- QR code payments
- Digital wallets

// Features
- Form validation with real-time feedback
- Tip calculation and customization
- Payment method switching
- QR code generation and expiration
- Security compliance (PCI DSS considerations)
- Multi-language support ready
```

**Security**: Implements client-side validation with secure form handling patterns.

### CounterDashboard Component

**Purpose**: Real-time kitchen order management system

```typescript
// Core Features
- Live order queue with real-time updates
- Order status management
- Performance analytics
- Kitchen efficiency metrics
- Timeline view of order progression
- Audio notifications for new orders
- Auto-refresh capabilities
- Order grouping by type

// Dashboard Analytics
interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  averageWaitTime: number;
  busyLevel: 'low' | 'medium' | 'high' | 'very-high';
}
```

**Real-time Integration**: Uses WebSocket connections for live updates and notification management.

## Design System

### Color Palette

```css
/* Primary Colors */
--primary-blue: #3B82F6;
--primary-green: #10B981;
--primary-orange: #F59E0B;
--primary-red: #EF4444;

/* Status Colors */
--status-pending: #F59E0B;    /* Yellow/Orange */
--status-confirmed: #3B82F6;  /* Blue */
--status-preparing: #8B5CF6;  /* Purple */
--status-ready: #10B981;      /* Green */
--status-completed: #6B7280;  /* Gray */
--status-cancelled: #EF4444;  /* Red */
```

### Typography

```css
/* Heading Scale */
.text-3xl { font-size: 1.875rem; }  /* Main titles */
.text-2xl { font-size: 1.5rem; }    /* Section headers */
.text-xl { font-size: 1.25rem; }    /* Card titles */
.text-lg { font-size: 1.125rem; }   /* Subsections */

/* Font Weights */
.font-bold { font-weight: 700; }    /* Important text */
.font-semibold { font-weight: 600; } /* Headers */
.font-medium { font-weight: 500; }   /* Labels */
```

### Responsive Breakpoints

```css
/* Tailwind CSS Breakpoints */
sm:  640px  /* Small tablets */
md:  768px  /* Large tablets */
lg:  1024px /* Laptops */
xl:  1280px /* Desktops */
2xl: 1536px /* Large screens */
```

## Accessibility Features

### ARIA Implementation

```typescript
// Automatic ARIA label generation
protected getAriaLabel(): string {
  return `Order ${this.order.orderNumber}, Status: ${this.getStatusLabel(this.order.status)}`;
}

// Keyboard navigation support
protected onKeyDown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'Enter':
    case ' ':
      this.onPrimaryAction();
      break;
    case 'Escape':
      this.onCancel();
      break;
  }
}
```

### Accessibility Standards

- **WCAG 2.1 AA Compliance** - Color contrast ratios, keyboard navigation
- **Screen Reader Support** - Semantic HTML, ARIA labels
- **Keyboard Navigation** - Tab order, focus management
- **High Contrast Mode** - Alternative color schemes
- **Reduced Motion** - Respects user preferences

## Theming System

### PrimeUI Themes Integration

```typescript
// Theme configuration
interface PrimeNGTheme {
  primary: string;
  secondary: string;
  surface: string;
  accent: string;
}

// Usage in components
@Input() theme: PrimeNGTheme = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  surface: '#FFFFFF',
  accent: '#10B981'
};
```

### Dark Mode Support

```scss
@media (prefers-color-scheme: dark) {
  .component-name {
    .bg-white { @apply bg-gray-800; }
    .text-gray-900 { @apply text-gray-100; }
    .border-gray-200 { @apply border-gray-600; }
  }
}
```

## Performance Optimization

### Change Detection Strategy

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedComponent {
  // Use OnPush strategy for better performance
}
```

### Lazy Loading

```typescript
// Feature modules with lazy loading
const routes: Routes = [
  {
    path: 'customer',
    loadChildren: () => import('./modules/customer/customer.module').then(m => m.CustomerModule)
  },
  {
    path: 'kitchen',
    loadChildren: () => import('./modules/kitchen/kitchen.module').then(m => m.KitchenModule)
  }
];
```

### TrackBy Functions

```typescript
// Efficient list rendering
trackByOrderId(index: number, order: Order): string {
  return order.id;
}

trackByProductId(index: number, product: Product): string {
  return product.id;
}
```

## Real-time Features

### WebSocket Integration

```typescript
// Real-time order updates
@Injectable()
export class OrderService {
  private socket = io(environment.socketUrl);

  subscribeToOrderUpdates(): Observable<Order> {
    return new Observable(observer => {
      this.socket.on('orderUpdate', (order: Order) => {
        observer.next(order);
      });
    });
  }
}
```

### State Management

```typescript
// Apollo GraphQL integration
@Injectable()
export class OrderStateService {
  orders$ = this.apollo.watchQuery<{orders: Order[]}>({
    query: GET_ORDERS,
    pollInterval: 30000 // Poll every 30 seconds
  }).valueChanges;
}
```

## Internationalization (i18n)

### Translation Support

```typescript
// NGX-Translate integration
@Component({
  template: `
    <p-button [label]="'BUTTON.SAVE' | translate">
    <p-button [label]="'BUTTON.CANCEL' | translate">
  `
})
export class InternationalComponent {
  constructor(private translate: TranslateService) {
    translate.setDefaultLang('en');
  }
}
```

### Language Files

```json
// en.json
{
  "ORDER": {
    "STATUS": {
      "PENDING": "Pending",
      "CONFIRMED": "Confirmed",
      "PREPARING": "Preparing",
      "READY": "Ready"
    }
  }
}
```

## Testing Strategy

### Unit Testing

```typescript
// Component testing with Angular Testing Utilities
describe('OrderCardComponent', () => {
  let component: OrderCardComponent;
  let fixture: ComponentFixture<OrderCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrderCardComponent],
      providers: [
        { provide: OrderService, useValue: mockOrderService }
      ]
    });
    fixture = TestBed.createComponent(OrderCardComponent);
    component = fixture.componentInstance;
  });

  it('should display order status correctly', () => {
    component.order = mockOrder;
    fixture.detectChanges();

    const statusTag = fixture.debugElement.query(By.css('p-tag'));
    expect(statusTag.nativeElement.textContent).toContain('Pending');
  });
});
```

### E2E Testing

```typescript
// Cypress integration tests
describe('Order Management Flow', () => {
  it('should create and update order status', () => {
    cy.visit('/kitchen/dashboard');
    cy.get('[data-cy=order-card]').first().click();
    cy.get('[data-cy=status-button-preparing]').click();
    cy.get('[data-cy=order-status]').should('contain', 'Preparing');
  });
});
```

## Deployment and Build

### Production Build

```bash
# Build for production
ng build --configuration=production

# Build with SSR
npm run build:ssr

# Serve SSR application
npm run serve:ssr
```

### PWA Configuration

```json
// ngsw-config.json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/*.css",
          "/*.js"
        ]
      }
    }
  ]
}
```

## Usage Examples

### Complete Order Management Flow

```typescript
// Customer places order
@Component({
  template: `
    <app-product-grid
      [products]="products"
      [categories]="categories"
      (productAdd)="addToCart($event)">
    </app-product-grid>

    <app-payment-dialog
      [(visible)]="showPayment"
      [order]="currentOrder"
      (paymentComplete)="onPaymentComplete($event)">
    </app-payment-dialog>
  `
})
export class CustomerOrderComponent {
  addToCart(product: Product): void {
    this.cartService.addItem(product);
  }

  onPaymentComplete(paymentData: PaymentData): void {
    this.orderService.completeOrder(this.currentOrder, paymentData);
  }
}

// Kitchen receives and processes order
@Component({
  template: `
    <app-counter-dashboard
      [orders]="orders$ | async"
      [config]="dashboardConfig"
      (orderStatusChange)="updateOrderStatus($event)">
    </app-counter-dashboard>
  `
})
export class KitchenDashboardComponent {
  orders$ = this.orderService.getActiveOrders();

  updateOrderStatus(event: {order: Order, newStatus: OrderStatus}): void {
    this.orderService.updateStatus(event.order.id, event.newStatus);
  }
}
```

### Real-time Integration

```typescript
// WebSocket service integration
@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private socket = io(environment.socketUrl);

  // Order updates
  orderUpdates$ = new Observable<Order>(observer => {
    this.socket.on('orderUpdate', order => observer.next(order));
  });

  // Notification system
  notifications$ = new Observable<Notification>(observer => {
    this.socket.on('notification', notification => observer.next(notification));
  });
}

// Component usage
@Component({
  template: `
    <app-notification-toast
      [notifications]="notifications$ | async">
    </app-notification-toast>
  `
})
export class AppComponent implements OnInit {
  notifications$ = this.realtimeService.notifications$;

  ngOnInit(): void {
    this.realtimeService.orderUpdates$
      .pipe(takeUntilDestroyed())
      .subscribe(order => {
        this.handleOrderUpdate(order);
      });
  }
}
```

## Best Practices

### Component Development

1. **Single Responsibility** - Each component should have one clear purpose
2. **Composition over Inheritance** - Use component composition when possible
3. **Immutable Data** - Use OnPush change detection with immutable data patterns
4. **Reactive Programming** - Use RxJS for data streams and async operations
5. **Type Safety** - Leverage TypeScript's type system for better development experience

### Performance Guidelines

1. **Lazy Loading** - Load feature modules on demand
2. **Change Detection** - Use OnPush strategy and pure pipes
3. **Bundle Optimization** - Tree-shake unused code and optimize imports
4. **Caching** - Implement proper caching strategies for API calls
5. **Image Optimization** - Use responsive images and lazy loading

### Accessibility Requirements

1. **Semantic HTML** - Use proper HTML elements for their intended purpose
2. **ARIA Labels** - Provide descriptive labels for screen readers
3. **Keyboard Navigation** - Ensure all functionality is keyboard accessible
4. **Color Contrast** - Maintain WCAG AA contrast ratios
5. **Focus Management** - Implement proper focus order and visibility

## Conclusion

This component library provides a comprehensive foundation for building restaurant management applications with Angular, PrimeNG, and Tailwind CSS. The modular architecture, responsive design, and real-time capabilities make it suitable for various restaurant operation scales, from small cafes to large restaurant chains.

The library emphasizes developer experience through TypeScript integration, comprehensive documentation, and consistent design patterns while maintaining high accessibility standards and performance optimization.

For implementation guidance, refer to the individual component files and their accompanying documentation. Each component includes detailed examples, configuration options, and integration patterns for seamless development experience.