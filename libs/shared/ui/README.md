# TableTap Shared UI Components

A comprehensive library of reusable Angular components built with PrimeNG integration for the TableTap application.

## Installation

The components are available through the path mapping in `tsconfig.base.json`:

```typescript
import { EmptyStateComponent, LoadingSpinnerComponent } from '@tabletap/shared/ui';
```

## Components Overview

### Core Components

#### EmptyStateComponent
A flexible component for displaying empty states with optional actions.

```html
<tabletap-empty-state
  icon="pi pi-shopping-cart"
  title="Your cart is empty"
  subtitle="Browse our menu and add some delicious items!"
  [showAction]="true"
  actionLabel="Browse Menu"
  actionIcon="pi pi-search"
  (actionClick)="navigateToMenu()">
</tabletap-empty-state>
```

**Features:**
- Customizable icon, title, subtitle, and description
- Optional action button with events
- Support for custom content via ng-content
- Responsive design
- Accessibility features

#### LoadingSpinnerComponent
Multiple loading spinner variations with customizable styling.

```html
<tabletap-loading-spinner
  type="spinner"
  size="medium"
  variant="overlay"
  [showText]="true"
  text="Loading your order...">
</tabletap-loading-spinner>
```

**Types:** `spinner`, `dots`, `pulse`, `ring`
**Variants:** `fullscreen`, `overlay`, `inline`, `compact`
**Sizes:** `small`, `medium`, `large`

#### ErrorDisplayComponent
Comprehensive error display with different presentation modes.

```html
<tabletap-error-display
  [error]="errorInfo"
  displayMode="detailed"
  [showRetry]="true"
  [showReport]="false"
  (retry)="onRetry()"
  (report)="onReport($event)">
</tabletap-error-display>
```

**Display Modes:** `simple`, `detailed`, `card`

#### SkeletonComponent
Loading placeholders for content areas.

```html
<tabletap-skeleton
  width="100%"
  height="2rem"
  shape="text">
</tabletap-skeleton>
```

**Shapes:** `rectangle`, `circle`, `text`, `button`, `avatar`, `card`

### Layout Components

#### ResponsiveGridComponent
Flexible grid system with responsive breakpoints.

```html
<tabletap-responsive-grid
  responsive="1-2-3"
  gap="medium"
  [equalHeight]="true">
  <div>Grid item 1</div>
  <div>Grid item 2</div>
  <div>Grid item 3</div>
</tabletap-responsive-grid>
```

**Responsive Options:** `auto-fit`, `auto-fill`, `1-2-3`, `1-2-4`, `2-3-4`

#### ContainerComponent
Responsive container with size variants.

```html
<tabletap-container
  size="lg"
  [centered]="true"
  padding="md">
  <p>Container content</p>
</tabletap-container>
```

**Sizes:** `fluid`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl`

#### SectionComponent
Semantic section wrapper with header and footer slots.

```html
<tabletap-section
  title="Featured Items"
  subtitle="Our most popular menu items"
  spacing="default"
  background="surface">
  <div>Section content</div>
</tabletap-section>
```

#### DividerComponent
Customizable dividers for content separation.

```html
<tabletap-divider
  layout="horizontal"
  type="solid"
  spacing="large">
  Optional content
</tabletap-divider>
```

### UI Components

#### ButtonComponent
Enhanced button with additional styling options.

```html
<tabletap-button
  label="Add to Cart"
  icon="pi pi-plus"
  severity="primary"
  size="large"
  width="fullwidth"
  (buttonClick)="onAddToCart()">
</tabletap-button>
```

#### IconButtonComponent
Icon-only button with tooltip support.

```html
<tabletap-icon-button
  icon="pi pi-heart"
  shape="circle"
  severity="secondary"
  ariaLabel="Add to favorites"
  tooltip="Add to favorites"
  (buttonClick)="onToggleFavorite()">
</tabletap-icon-button>
```

**Shapes:** `default`, `circle`, `square`

#### CardComponent
Basic card wrapper with styling variants.

```html
<tabletap-card
  header="Card Title"
  variant="elevated"
  [hoverable]="true"
  [clickable]="true">
  <p>Card content</p>
  <ng-template pTemplate="footer">
    <button>Action</button>
  </ng-template>
</tabletap-card>
```

#### ContentCardComponent
Advanced card with image, metadata, and actions.

```html
<tabletap-content-card
  title="Margherita Pizza"
  subtitle="Classic Italian"
  description="Fresh tomatoes, mozzarella, and basil"
  imageUrl="/assets/pizza.jpg"
  [hoverable]="true"
  [actions]="cardActions"
  [metadata]="cardMetadata"
  (actionClick)="onCardAction($event)">
</tabletap-content-card>
```

#### BadgeComponent
Versatile badge/tag component.

```html
<tabletap-badge
  variant="tag"
  value="New"
  severity="success"
  icon="pi pi-star"
  [rounded]="true">
</tabletap-badge>
```

**Variants:** `badge`, `tag`, `dot`

### Dialog & Notification Components

#### ConfirmDialogComponent
Confirmation dialog service with predefined methods.

```typescript
constructor(private confirmDialog: ConfirmDialogComponent) {}

async deleteItem() {
  const confirmed = await this.confirmDialog.confirmDelete('this item');
  if (confirmed) {
    // Proceed with deletion
  }
}
```

#### ToastNotificationComponent & Service
Toast notifications with service integration.

```typescript
constructor(private toastService: ToastNotificationService) {}

showSuccess() {
  this.toastService.success('Success!', 'Item added to cart');
}
```

## Usage Examples

### Basic Setup

1. Import components in your module or standalone component:

```typescript
import {
  EmptyStateComponent,
  LoadingSpinnerComponent,
  ErrorDisplayComponent
} from '@tabletap/shared/ui';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    ErrorDisplayComponent
  ],
  // ...
})
```

2. Use in templates:

```html
<!-- Loading State -->
<tabletap-loading-spinner
  *ngIf="loading"
  type="spinner"
  size="large"
  text="Loading menu items...">
</tabletap-loading-spinner>

<!-- Error State -->
<tabletap-error-display
  *ngIf="error"
  [error]="error"
  displayMode="detailed"
  [showRetry]="true"
  (retry)="loadData()">
</tabletap-error-display>

<!-- Empty State -->
<tabletap-empty-state
  *ngIf="!loading && !error && items.length === 0"
  icon="pi pi-search"
  title="No items found"
  subtitle="Try adjusting your search criteria">
</tabletap-empty-state>

<!-- Content Grid -->
<tabletap-responsive-grid
  *ngIf="!loading && !error && items.length > 0"
  responsive="1-2-3"
  gap="large">
  <tabletap-content-card
    *ngFor="let item of items"
    [title]="item.name"
    [description]="item.description"
    [imageUrl]="item.imageUrl"
    [actions]="getItemActions(item)"
    (actionClick)="onItemAction($event)">
  </tabletap-content-card>
</tabletap-responsive-grid>
```

### Advanced Patterns

#### Loading States with Skeletons

```html
<tabletap-responsive-grid responsive="1-2-3" gap="medium">
  <div *ngFor="let i of [1,2,3,4,5,6]; trackBy: trackByIndex">
    <tabletap-card *ngIf="loading; else contentCard">
      <tabletap-skeleton height="200px" shape="card" class="mb-3"></tabletap-skeleton>
      <tabletap-skeleton height="1.5rem" width="80%" class="mb-2"></tabletap-skeleton>
      <tabletap-skeleton height="1rem" width="60%"></tabletap-skeleton>
    </tabletap-card>

    <ng-template #contentCard>
      <tabletap-content-card [item]="items[i-1]"></tabletap-content-card>
    </ng-template>
  </div>
</tabletap-responsive-grid>
```

#### Error Boundaries

```typescript
@Component({
  template: `
    <tabletap-error-display
      *ngIf="hasError; else content"
      [error]="errorInfo"
      displayMode="card"
      [showRetry]="true"
      [showReport]="true"
      (retry)="retryOperation()"
      (report)="reportError($event)">
    </tabletap-error-display>

    <ng-template #content>
      <ng-content></ng-content>
    </ng-template>
  `
})
export class ErrorBoundaryComponent implements OnInit, OnDestroy {
  hasError = false;
  errorInfo?: ErrorInfo;

  // Error handling logic...
}
```

## Styling and Theming

All components follow PrimeNG's design system and support:

- CSS custom properties for theming
- Dark mode support via `:host-context(.dark)`
- Responsive design with mobile-first approach
- High contrast mode support
- Reduced motion preferences

## Accessibility

Components include:

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

## Best Practices

1. **Consistent Loading States**: Use `LoadingSpinnerComponent` consistently across the app
2. **Error Handling**: Implement `ErrorDisplayComponent` in data-heavy components
3. **Empty States**: Always provide meaningful empty states with `EmptyStateComponent`
4. **Responsive Design**: Use `ResponsiveGridComponent` for consistent layouts
5. **User Feedback**: Integrate `ToastNotificationService` for action feedback

## Contributing

When adding new components:

1. Follow the existing component structure
2. Include comprehensive TypeScript interfaces
3. Implement proper accessibility features
4. Add responsive design considerations
5. Update the main index.ts export file
6. Document usage examples

## Dependencies

- Angular 20+
- PrimeNG 20+
- PrimeIcons 7+
- CommonModule

All components are standalone and follow Angular's modern patterns.