# Cart Module

A comprehensive shopping cart system for the TableTap Angular frontend application. This module provides complete cart functionality with signal-based state management, PrimeNG integration, and seamless user experience.

## Features

### 🛒 Core Cart Functionality
- **Signal-based State Management**: Reactive cart state using Angular signals
- **Persistent Storage**: LocalStorage integration with backup and recovery
- **Real-time Updates**: Automatic UI updates when cart changes
- **Cart Validation**: Comprehensive validation with user-friendly error messages

### 🎨 UI Components
- **Cart Display**: Full cart view with item management
- **Cart Item**: Individual item editing with customizations
- **Cart Icon**: Header cart icon with item count badge and preview
- **Order Summary**: Pricing breakdown with checkout functionality

### 💰 Pricing & Calculations
- **Dynamic Pricing**: Real-time price calculations with customizations
- **Tax & Fees**: Automatic tax and service fee calculations
- **Discount Support**: Discount code application and validation
- **Minimum Order**: Progress tracking for minimum order requirements

### 🎯 Advanced Features
- **Item Customizations**: Complex customization management
- **Quantity Management**: Smart quantity controls with limits
- **Error Handling**: Robust error handling with user feedback
- **Accessibility**: Full WCAG compliance with keyboard navigation
- **Mobile Responsive**: Optimized for all screen sizes

## Quick Start

### Installation

```bash
npm install @tabletap/frontend-modules-cart
```

### Basic Usage

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { CartIconComponent } from '@tabletap/frontend-modules-cart';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CartIconComponent],
  template: `
    <header>
      <nav>
        <tabletap-cart-icon></tabletap-cart-icon>
      </nav>
    </header>
  `
})
export class AppComponent {}
```

### Adding Items to Cart

```typescript
// menu-item.component.ts
import { Component, inject } from '@angular/core';
import { CartService, AddToCartRequest } from '@tabletap/frontend-modules-cart';

@Component({
  selector: 'app-menu-item',
  template: `
    <button (click)="addToCart()">Add to Cart</button>
  `
})
export class MenuItemComponent {
  private cartService = inject(CartService);

  addToCart() {
    const request: AddToCartRequest = {
      menuItemId: 'item-123',
      quantity: 1,
      customizations: [
        {
          customizationId: 'size',
          selectedOptions: ['large']
        }
      ],
      notes: 'Extra sauce please'
    };

    this.cartService.addToCart(request);
  }
}
```

## Components

### CartDisplayComponent

Full cart display with item management and checkout functionality.

```typescript
import { CartDisplayComponent } from '@tabletap/frontend-modules-cart';

// Template
<tabletap-cart-display></tabletap-cart-display>
```

**Features:**
- Item list with editing capabilities
- Order summary with pricing breakdown
- Checkout validation and error handling
- Empty state handling
- Loading states

### CartIconComponent

Header cart icon with item count badge and preview overlay.

```typescript
import { CartIconComponent } from '@tabletap/frontend-modules-cart';

// Template
<tabletap-cart-icon
  [size]="'large'"
  [showPreview]="true"
  [maxPreviewItems]="3"
  (cartClick)="onCartClick()"
  (checkout)="onCheckout()">
</tabletap-cart-icon>
```

**Properties:**
- `size`: 'small' | 'normal' | 'large'
- `outlined`: boolean
- `text`: boolean
- `showPreview`: boolean
- `maxPreviewItems`: number

**Events:**
- `cartClick`: Cart icon clicked
- `viewCart`: Navigate to cart page
- `checkout`: Navigate to checkout

### CartItemComponent

Individual cart item with editing capabilities.

```typescript
import { CartItemComponent } from '@tabletap/frontend-modules-cart';

// Template
<tabletap-cart-item
  [item]="cartItem"
  [disabled]="false"
  [maxQuantity]="10"
  (quantityChange)="onQuantityChange($event)"
  (customizationChange)="onCustomizationChange($event)"
  (notesChange)="onNotesChange($event)"
  (remove)="onRemove($event)">
</tabletap-cart-item>
```

**Features:**
- Quantity editing with validation
- Customization management
- Special instructions
- Image display
- Remove functionality

### OrderSummaryComponent

Pricing breakdown and checkout functionality.

```typescript
import { OrderSummaryComponent } from '@tabletap/frontend-modules-cart';

// Template
<tabletap-order-summary
  [cart]="cart"
  [isCheckoutEnabled]="true"
  [errors]="validationErrors"
  (checkout)="onCheckout()"
  (applyDiscount)="onApplyDiscount($event)">
</tabletap-order-summary>
```

**Features:**
- Subtotal, tax, and fee calculations
- Discount code application
- Minimum order progress
- Checkout validation
- Payment method preview

## Services

### CartService

Main service for cart state management.

```typescript
import { CartService } from '@tabletap/frontend-modules-cart';

@Component({})
export class MyComponent {
  private cartService = inject(CartService);

  // Reactive cart state
  cart = this.cartService.cart;
  items = this.cartService.items;
  itemCount = this.cartService.itemCount;
  total = this.cartService.total;
  isEmpty = this.cartService.isEmpty;

  // Cart operations
  async addItem() {
    await this.cartService.addToCart({
      menuItemId: 'item-123',
      quantity: 1,
      customizations: []
    });
  }

  removeItem(itemId: string) {
    this.cartService.removeCartItem(itemId);
  }

  clearCart() {
    this.cartService.clearCart();
  }
}
```

### CartStorageService

Handles persistent storage with backup and recovery.

```typescript
import { CartStorageService } from '@tabletap/frontend-modules-cart';

@Injectable()
export class MyService {
  constructor(private storage: CartStorageService) {}

  exportCart() {
    return this.storage.exportCart();
  }

  importCart(cartData: string) {
    return this.storage.importCart(cartData);
  }
}
```

### CartValidationService

Provides comprehensive cart validation.

```typescript
import { CartValidationService } from '@tabletap/frontend-modules-cart';

@Injectable()
export class MyService {
  constructor(private validation: CartValidationService) {}

  async validateCart(cart: Cart) {
    return this.validation.validateCartForCheckout(cart);
  }
}
```

## Models

### Core Models

```typescript
// Cart structure
interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  fees: CartFee[];
  discount: number;
  total: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

// Cart item with customizations
interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  description?: string;
  basePrice: number;
  quantity: number;
  customizations: CartItemCustomization[];
  totalPrice: number;
  imageUrl?: string;
  category: string;
  notes?: string;
  addedAt: Date;
}

// Item customization
interface CartItemCustomization {
  id: string;
  name: string;
  type: CustomizationType;
  options: CustomizationOption[];
  required: boolean;
  maxSelections?: number;
}
```

## Utilities

### CartUtils

Helper functions for cart operations.

```typescript
import { CartUtils } from '@tabletap/frontend-modules-cart';

// Calculate item total with customizations
const total = CartUtils.calculateItemTotal(cartItem);

// Check if items are identical
const identical = CartUtils.areItemsIdentical(item1, item2);

// Get customizations summary
const summary = CartUtils.getCustomizationsSummary(customizations);

// Estimate delivery time
const estimate = CartUtils.estimateDeliveryTime(items, distanceKm);
```

## Configuration

### Cart Configuration

```typescript
interface CartConfig {
  maxItems: number;              // Maximum items in cart
  maxQuantityPerItem: number;    // Maximum quantity per item
  taxRate: number;               // Tax rate (e.g., 0.08 for 8%)
  serviceFeeRate: number;        // Service fee rate
  deliveryFee: number;           // Fixed delivery fee
  minimumOrderAmount: number;    // Minimum order requirement
  cartExpirationHours: number;   // Cart expiration time
}
```

### Default Configuration

```typescript
const defaultConfig: CartConfig = {
  maxItems: 50,
  maxQuantityPerItem: 10,
  taxRate: 0.08,
  serviceFeeRate: 0.03,
  deliveryFee: 2.99,
  minimumOrderAmount: 10.00,
  cartExpirationHours: 24
};
```

## Integration Examples

### Menu Integration

```typescript
// menu-item.component.ts
import { Component, Input, inject } from '@angular/core';
import { CartService, AddToCartRequest } from '@tabletap/frontend-modules-cart';

@Component({
  selector: 'app-menu-item',
  template: `
    <div class="menu-item">
      <h3>{{ item.name }}</h3>
      <p>{{ item.price | currency }}</p>

      <button
        (click)="addToCart()"
        [disabled]="!canAddToCart()">
        Add to Cart
      </button>
    </div>
  `
})
export class MenuItemComponent {
  @Input() item: any;

  private cartService = inject(CartService);

  canAddToCart(): boolean {
    return this.cartService.canAddMoreItems();
  }

  async addToCart(): Promise<void> {
    const request: AddToCartRequest = {
      menuItemId: this.item.id,
      quantity: 1,
      customizations: [],
      notes: ''
    };

    await this.cartService.addToCart(request);
  }
}
```

### Layout Integration

```typescript
// layout.component.ts
import { Component } from '@angular/core';
import { CartIconComponent } from '@tabletap/frontend-modules-cart';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CartIconComponent],
  template: `
    <header class="app-header">
      <nav class="navbar">
        <div class="nav-brand">TableTap</div>
        <div class="nav-actions">
          <tabletap-cart-icon
            [size]="'normal'"
            [showPreview]="true"
            (viewCart)="navigateToCart()"
            (checkout)="navigateToCheckout()">
          </tabletap-cart-icon>
        </div>
      </nav>
    </header>
  `
})
export class LayoutComponent {
  navigateToCart(): void {
    // Navigation logic
  }

  navigateToCheckout(): void {
    // Navigation logic
  }
}
```

## Styling

The cart module uses PrimeNG components and follows the theme system. You can customize the appearance using CSS custom properties:

```css
:root {
  --cart-primary-color: #3b82f6;
  --cart-border-radius: 8px;
  --cart-box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Custom cart styles */
.cart-display {
  --surface-card: #ffffff;
  --surface-border: #e5e7eb;
  --text-color: #374151;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .cart-display {
    --surface-card: #1f2937;
    --surface-border: #374151;
    --text-color: #f9fafb;
  }
}
```

## Accessibility

The cart module includes comprehensive accessibility features:

- **ARIA Labels**: All interactive elements have proper ARIA labels
- **Keyboard Navigation**: Full keyboard support for all functionality
- **Screen Reader Support**: Semantic HTML with proper labeling
- **Focus Management**: Logical focus order and visible focus indicators
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user's motion preferences

## Performance

### Optimizations

- **Signal-based Reactivity**: Efficient change detection
- **Virtual Scrolling**: For large cart item lists
- **Lazy Loading**: Components load on demand
- **Memoization**: Expensive calculations are cached
- **Bundle Splitting**: Module is tree-shakeable

### Best Practices

```typescript
// Use trackBy for ngFor loops
trackByItemId(index: number, item: CartItem): string {
  return item.id;
}

// Debounce quantity changes
@debounce(300)
onQuantityChange(quantity: number): void {
  this.cartService.updateQuantity(this.item.id, quantity);
}
```

## Testing

The cart module includes comprehensive test coverage:

```bash
# Run tests
npm run test:cart

# Run tests with coverage
npm run test:cart -- --coverage

# Run e2e tests
npm run e2e:cart
```

## Migration Guide

### From v1.x to v2.x

1. **Update imports**: Module is now standalone
2. **Signal adoption**: State is now signal-based
3. **Service injection**: Use `inject()` function
4. **Component updates**: New input/output properties

```typescript
// Before (v1.x)
constructor(private cartService: CartService) {}

// After (v2.x)
private cartService = inject(CartService);
```

## Contributing

1. Follow the Angular style guide
2. Write comprehensive tests
3. Update documentation
4. Use conventional commits

## License

MIT License - see LICENSE file for details.