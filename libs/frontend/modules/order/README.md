# Order Module

A comprehensive Angular module for handling order placement workflow in the TableTap application.

## Features

- **Order Checkout**: Customer information form with validation
- **Order Confirmation**: Review order details before submission
- **Payment Processing**: Multiple payment method support with error handling
- **Order Tracking**: Real-time order status updates with progress visualization
- **Receipt Generation**: Downloadable order receipts
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Real-time Updates**: WebSocket subscription for order status changes

## Components

### OrderCheckoutComponent
- Customer information form with validation
- Payment method selection
- Order summary display
- Auto-validation and error handling

### OrderConfirmationComponent
- Order review and confirmation
- Payment processing
- Terms and conditions acceptance
- Loading states and error handling

### OrderTrackingComponent
- Real-time order status tracking
- Progress visualization with timeline
- Estimated completion time
- Order cancellation (when applicable)
- Receipt download

### PaymentMethodSelectorComponent
- Reusable payment method selector
- Support for multiple payment types
- Add new payment method functionality
- Default method selection

## Services

### OrderService
- Reactive state management with Angular signals
- GraphQL integration for order operations
- Real-time order status subscriptions
- Error handling and retry mechanisms
- Order validation and submission

## Models

### Core Types
- `Order`: Complete order data structure
- `CustomerInfo`: Customer information interface
- `PaymentMethod`: Payment method details
- `OrderStatus`: Order status enumeration
- `OrderSummary`: Order pricing and totals

## Guards

### OrderGuard
- Protects order routes based on required data
- Validates checkout prerequisites
- Ensures order exists for tracking

### OrderCompletionGuard
- Prevents access to new orders when one is in progress
- Redirects to active order tracking

## Pipes

### Order Status Pipes
- `orderStatus`: Format order status for display
- `orderStatusColor`: Get status color for UI
- `orderProgress`: Calculate progress percentage
- `estimatedTime`: Format time duration
- `paymentType`: Format payment type names

## Utilities

### OrderUtils
- Order validation helpers
- Status and progress calculations
- Currency and time formatting
- Receipt generation
- Error handling utilities

## Usage

### Basic Setup

```typescript
import { OrderModule } from '@libs/frontend/modules/order';

@NgModule({
  imports: [
    OrderModule
  ]
})
export class AppModule { }
```

### Routing Setup

```typescript
import { orderRoutes } from '@libs/frontend/modules/order';

const routes: Routes = [
  {
    path: 'order',
    children: orderRoutes
  }
];
```

### Service Integration

```typescript
import { OrderService } from '@libs/frontend/modules/order';

@Component({...})
export class CartComponent {
  constructor(private orderService: OrderService) {}

  proceedToCheckout() {
    // Set order summary from cart
    this.orderService.setOrderSummary(this.cartSummary);
    this.router.navigate(['/order/checkout']);
  }
}
```

### Component Usage

```typescript
// Using the payment method selector
import { PaymentMethodSelectorComponent } from '@libs/frontend/modules/order';

@Component({
  template: `
    <app-payment-method-selector
      [methods]="paymentMethods"
      [selectedId]="selectedPaymentId"
      (methodSelected)="onMethodSelected($event)"
      (addMethodClicked)="onAddMethod()"
    />
  `
})
export class CheckoutComponent {
  onMethodSelected(method: PaymentMethod) {
    this.orderService.setPaymentMethod(method);
  }
}
```

## GraphQL Integration

The module includes comprehensive GraphQL operations:

- `CREATE_ORDER`: Submit new order
- `PROCESS_PAYMENT`: Process payment
- `ORDER_STATUS_SUBSCRIPTION`: Real-time status updates
- `GET_ORDER_BY_ID`: Fetch order details
- `CANCEL_ORDER`: Cancel existing order

## State Management

Uses Angular signals for reactive state management:

```typescript
// Reactive order state
readonly currentOrder = computed(() => this.orderService.currentOrder());
readonly orderStatus = computed(() => this.orderService.orderStatus());
readonly canSubmit = computed(() => this.orderService.canSubmitOrder());
```

## Error Handling

Comprehensive error handling with user-friendly messages:

```typescript
// Service handles errors automatically
this.orderService.submitOrder().subscribe({
  next: (response) => {
    // Success handling
  },
  error: (error) => {
    // Error is automatically set in service state
    // Component can react to orderService.error() signal
  }
});
```

## Real-time Features

- WebSocket subscriptions for order status updates
- Automatic retry mechanisms for failed operations
- Real-time progress visualization
- Live estimated completion times

## Testing

The module includes comprehensive test coverage for:

- Component interactions
- Service methods
- Guard functionality
- Pipe transformations
- Utility functions

## Browser Support

- Modern browsers with ES2020+ support
- Angular 17+ features (signals, standalone components)
- WebSocket support for real-time updates

## Dependencies

- Angular 17+
- Apollo Angular (GraphQL)
- RxJS 7+
- Angular Router
- Angular Forms