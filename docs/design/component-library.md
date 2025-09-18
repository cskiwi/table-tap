# Component Library Specification - Table Tap Restaurant Ordering System

## Design Token Integration

All components utilize the design system tokens defined in `design-system.md` and integrate seamlessly with PrimeNG and Tailwind CSS.

## Base Component Architecture

### Component Hierarchy
```
Base Components (Atomic)
├── Buttons
├── Form Elements
├── Typography
├── Icons
└── Containers

Composite Components (Molecular)
├── Cards
├── Navigation
├── Forms
├── Data Display
└── Overlays

Page Components (Organisms)
├── Headers
├── Footers
├── Sections
└── Layouts

Templates (Page Level)
├── Customer Interface
├── Kitchen Display
├── Dashboard
└── Admin Panel
```

## Atomic Components

### 1. Button Components

#### Primary Button
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}
```

```html
<!-- Usage Examples -->
<app-button
  variant="primary"
  size="lg"
  [loading]="isSubmitting"
  icon="pi pi-check"
  (click)="handleSubmit()">
  Place Order
</app-button>

<app-button
  variant="secondary"
  size="md"
  icon="pi pi-plus"
  iconPosition="left">
  Add to Cart
</app-button>
```

#### Tailwind CSS Classes
```css
.btn-base {
  @apply inline-flex items-center justify-center font-medium rounded-lg
         transition-all duration-200 focus:outline-none focus:ring-2
         focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-primary {
  @apply btn-base bg-primary hover:bg-primary-dark text-white
         focus:ring-primary-light shadow-sm hover:shadow-md;
}

.btn-secondary {
  @apply btn-base bg-gray-100 hover:bg-gray-200 text-gray-700
         focus:ring-gray-300 border border-gray-200;
}

.btn-danger {
  @apply btn-base bg-red-600 hover:bg-red-700 text-white
         focus:ring-red-200 shadow-sm hover:shadow-md;
}

/* Size variants */
.btn-sm { @apply px-3 py-2 text-sm min-h-[36px]; }
.btn-md { @apply px-4 py-2.5 text-base min-h-[44px]; }
.btn-lg { @apply px-6 py-3 text-lg min-h-[52px]; }
```

### 2. Form Components

#### Input Field
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: string;
  clearable?: boolean;
}
```

```html
<app-input
  label="Customer Name"
  placeholder="Enter your name"
  type="text"
  [required]="true"
  [error]="nameError"
  icon="pi pi-user"
  [(ngModel)]="customerName">
</app-input>
```

#### Dropdown/Select
```typescript
interface DropdownProps {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  multiple?: boolean;
  error?: string;
  disabled?: boolean;
}

interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  icon?: string;
}
```

```html
<app-dropdown
  label="Table Number"
  placeholder="Select table"
  [options]="tableOptions"
  [searchable]="true"
  [(ngModel)]="selectedTable">
</app-dropdown>
```

### 3. Typography Components

#### Text Components
```typescript
interface TextProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  truncate?: boolean;
}
```

```html
<app-text variant="h1" color="primary">Restaurant Menu</app-text>
<app-text variant="body" truncate>Long description text...</app-text>
<app-text variant="caption" color="secondary">Order placed 5 min ago</app-text>
```

#### Tailwind Typography Classes
```css
.text-h1 { @apply text-3xl font-bold leading-tight; }
.text-h2 { @apply text-2xl font-semibold leading-tight; }
.text-h3 { @apply text-xl font-semibold leading-snug; }
.text-h4 { @apply text-lg font-medium leading-snug; }
.text-body { @apply text-base leading-relaxed; }
.text-caption { @apply text-sm text-gray-600 leading-normal; }
.text-label { @apply text-sm font-medium leading-none; }
```

### 4. Icon Components

#### Icon System
```typescript
interface IconProps {
  name: string; // PrimeIcons name
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  spin?: boolean;
}
```

```html
<app-icon name="pi-shopping-cart" size="lg" color="primary"></app-icon>
<app-icon name="pi-spinner" spin></app-icon>
```

## Molecular Components

### 1. Card Components

#### Menu Item Card
```typescript
interface MenuItemCardProps {
  item: MenuItem;
  showAddButton?: boolean;
  showRating?: boolean;
  compact?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  available: boolean;
}
```

```html
<app-menu-item-card
  [item]="menuItem"
  [showAddButton]="true"
  [showRating]="true"
  (addToCart)="onAddToCart($event)"
  (viewDetails)="onViewDetails($event)">
</app-menu-item-card>
```

#### Order Card
```typescript
interface OrderCardProps {
  order: Order;
  variant: 'customer' | 'kitchen' | 'summary';
  actions?: OrderAction[];
  timeDisplay?: boolean;
}

interface Order {
  id: string;
  tableNumber?: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  timestamp: Date;
  estimatedTime?: number;
  specialInstructions?: string;
}
```

```html
<app-order-card
  [order]="orderData"
  variant="kitchen"
  [timeDisplay]="true"
  [actions]="kitchenActions"
  (statusUpdate)="onStatusUpdate($event)">
</app-order-card>
```

### 2. Navigation Components

#### Bottom Navigation (Mobile)
```typescript
interface BottomNavProps {
  items: NavItem[];
  activeIndex: number;
}

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}
```

```html
<app-bottom-nav
  [items]="navItems"
  [activeIndex]="currentIndex"
  (navigate)="onNavigate($event)">
</app-bottom-nav>
```

#### Sidebar Navigation
```typescript
interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  showLabels?: boolean;
}
```

```html
<app-sidebar
  [items]="sidebarItems"
  [collapsed]="sidebarCollapsed"
  (navigate)="onNavigate($event)"
  (toggleCollapse)="onToggleCollapse()">
</app-sidebar>
```

### 3. Data Display Components

#### Stats Card
```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}
```

```html
<app-stats-card
  title="Total Orders"
  [value]="totalOrders"
  [change]="orderChange"
  changeType="increase"
  icon="pi-shopping-bag"
  color="primary">
</app-stats-card>
```

#### Data Table
```typescript
interface DataTableProps {
  data: any[];
  columns: TableColumn[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  sortable?: boolean;
  searchable?: boolean;
  actions?: TableAction[];
}

interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge';
  width?: string;
}
```

```html
<app-data-table
  [data]="orders"
  [columns]="orderColumns"
  [loading]="loading"
  [pagination]="true"
  [pageSize]="25"
  (rowSelect)="onRowSelect($event)">
</app-data-table>
```

### 4. Form Components

#### Order Form
```typescript
interface OrderFormProps {
  order: Partial<Order>;
  tables: Table[];
  showTableSelection?: boolean;
  showCustomerInfo?: boolean;
}
```

```html
<app-order-form
  [order]="currentOrder"
  [tables]="availableTables"
  [showTableSelection]="true"
  (save)="onSaveOrder($event)"
  (cancel)="onCancelOrder()">
</app-order-form>
```

#### Search Component
```typescript
interface SearchProps {
  placeholder?: string;
  debounceTime?: number;
  showFilters?: boolean;
  filters?: SearchFilter[];
}

interface SearchFilter {
  label: string;
  field: string;
  type: 'select' | 'range' | 'checkbox';
  options?: any[];
}
```

```html
<app-search
  placeholder="Search menu items..."
  [debounceTime]="300"
  [showFilters]="true"
  [filters]="menuFilters"
  (search)="onSearch($event)"
  (filter)="onFilter($event)">
</app-search>
```

## Organism Components

### 1. Header Components

#### Customer Header
```typescript
interface CustomerHeaderProps {
  restaurantName: string;
  tableNumber?: string;
  cartCount: number;
  showSearch?: boolean;
}
```

```html
<app-customer-header
  [restaurantName]="restaurant.name"
  [tableNumber]="tableNumber"
  [cartCount]="cartItems.length"
  [showSearch]="true"
  (search)="onSearch($event)"
  (cartClick)="onCartClick()">
</app-customer-header>
```

#### Dashboard Header
```typescript
interface DashboardHeaderProps {
  title: string;
  user: User;
  notifications: Notification[];
  actions?: HeaderAction[];
}
```

```html
<app-dashboard-header
  [title]="pageTitle"
  [user]="currentUser"
  [notifications]="notifications"
  [actions]="headerActions"
  (logout)="onLogout()"
  (notificationClick)="onNotificationClick($event)">
</app-dashboard-header>
```

### 2. Layout Components

#### Grid Layout
```typescript
interface GridLayoutProps {
  columns: number;
  gap?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
  breakpoints?: GridBreakpoint[];
}

interface GridBreakpoint {
  breakpoint: string;
  columns: number;
}
```

```html
<app-grid-layout
  [columns]="4"
  gap="md"
  [responsive]="true"
  [breakpoints]="gridBreakpoints">
  <!-- Grid items -->
</app-grid-layout>
```

### 3. Status Components

#### Order Status Timeline
```typescript
interface OrderStatusTimelineProps {
  order: Order;
  showEstimatedTime?: boolean;
  compact?: boolean;
}
```

```html
<app-order-status-timeline
  [order]="selectedOrder"
  [showEstimatedTime]="true"
  [compact]="false">
</app-order-status-timeline>
```

## Accessibility Features

### Keyboard Navigation
```typescript
// All interactive components support keyboard navigation
@HostListener('keydown', ['$event'])
onKeyDown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Enter':
    case ' ':
      this.onClick();
      break;
    case 'Escape':
      this.onCancel();
      break;
  }
}
```

### Screen Reader Support
```html
<!-- Proper ARIA labels and descriptions -->
<button
  [attr.aria-label]="buttonLabel"
  [attr.aria-describedby]="description"
  [attr.aria-pressed]="isPressed"
  role="button">
  {{buttonText}}
</button>

<!-- Live regions for dynamic updates -->
<div
  aria-live="polite"
  aria-atomic="true"
  class="sr-only">
  {{statusMessage}}
</div>
```

### Focus Management
```css
/* Custom focus styles */
.focus-visible:focus {
  @apply outline-none ring-2 ring-primary ring-offset-2;
}

/* Skip links for keyboard users */
.skip-link {
  @apply sr-only focus:not-sr-only focus:absolute focus:top-4
         focus:left-4 bg-primary text-white px-4 py-2 rounded-lg z-50;
}
```

## Responsive Patterns

### Container Queries (Future Enhancement)
```css
/* Component-level responsive design */
@container (min-width: 320px) {
  .menu-item-card {
    @apply flex-row;
  }
}

@container (min-width: 480px) {
  .menu-item-card {
    @apply flex-col;
  }
}
```

### Responsive Components
```typescript
@Component({
  selector: 'app-responsive-card',
  template: `
    <div
      class="card"
      [ngClass]="{
        'card-mobile': isMobile,
        'card-tablet': isTablet,
        'card-desktop': isDesktop
      }">
      <!-- Card content -->
    </div>
  `
})
export class ResponsiveCardComponent {
  @HostBinding('class') get cssClass() {
    return `responsive-card ${this.getDeviceClass()}`;
  }

  getDeviceClass(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
}
```

## Component Testing

### Unit Test Template
```typescript
describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ButtonComponent],
      imports: [ButtonModule]
    });

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('should emit click event when clicked', () => {
    spyOn(component.click, 'emit');

    component.onClick();

    expect(component.click.emit).toHaveBeenCalled();
  });

  it('should apply correct variant classes', () => {
    component.variant = 'primary';
    fixture.detectChanges();

    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement).toHaveClass('btn-primary');
  });

  it('should be accessible with keyboard navigation', () => {
    const buttonElement = fixture.nativeElement.querySelector('button');

    expect(buttonElement.getAttribute('tabindex')).toBe('0');
    expect(buttonElement.getAttribute('role')).toBe('button');
  });
});
```

## Performance Optimization

### Lazy Loading
```typescript
// Lazy load heavy components
const LazyChartComponent = lazy(() => import('./chart.component'));

@Component({
  template: `
    <ng-container *ngIf="showChart">
      <app-lazy-chart [data]="chartData"></app-lazy-chart>
    </ng-container>
  `
})
export class DashboardComponent {
  showChart = false;

  loadChart() {
    this.showChart = true;
  }
}
```

### Virtual Scrolling
```html
<!-- For large lists -->
<cdk-virtual-scroll-viewport itemSize="80" class="h-96">
  <app-menu-item-card
    *cdkVirtualFor="let item of menuItems"
    [item]="item">
  </app-menu-item-card>
</cdk-virtual-scroll-viewport>
```

This component library specification provides a comprehensive foundation for building consistent, accessible, and performant UI components across the entire restaurant ordering system.