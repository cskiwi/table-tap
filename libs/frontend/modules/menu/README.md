# Frontend Menu Module

Comprehensive customer-facing menu browsing components for the TableTap Angular frontend.

## Features

### 🔍 Search and Filtering
- Real-time search across menu items
- Category-based filtering
- Status filtering (Available, Out of Stock, Seasonal)
- Price range filtering
- Allergen exclusion filtering
- Preparation time filtering

### 📱 Responsive Design
- Grid and list view options
- Mobile-optimized layouts
- Touch-friendly interfaces
- Adaptive breakpoints

### ♿ Accessibility Features
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion preferences

### 🎨 UI Components
- **MenuDisplayComponent**: Main menu browsing interface
- **MenuItemDetailComponent**: Detailed item view with customization
- **MenuService**: Reactive state management with signals

## Usage

### Basic Implementation

```typescript
// app.component.ts
import { MenuDisplayComponent } from '@app/frontend-modules-menu';

@Component({
  imports: [MenuDisplayComponent],
  template: `
    <app-menu-display
      [cafeId]="cafeId"
      [cafeName]="cafeName"
      (itemSelected)="onItemSelected($event)"
      (addToCart)="onAddToCart($event)"
    ></app-menu-display>
  `
})
export class AppComponent {
  cafeId = 'your-cafe-id';
  cafeName = 'Your Restaurant';

  onItemSelected(item: MenuItem) {
    // Handle item selection
  }

  onAddToCart(item: MenuItem) {
    // Handle add to cart
  }
}
```

### With Item Detail Modal

```typescript
// menu-page.component.ts
import { MenuDisplayComponent, MenuItemDetailComponent } from '@app/frontend-modules-menu';

@Component({
  imports: [MenuDisplayComponent, MenuItemDetailComponent],
  template: `
    <app-menu-display
      [cafeId]="cafeId"
      [cafeName]="cafeName"
      (itemSelected)="showItemDetail($event)"
      (addToCart)="onAddToCart($event)"
    ></app-menu-display>

    <app-menu-item-detail
      [visible]="showDetail"
      [menuItem]="selectedItem"
      [customizationOptions]="customizationOptions"
      (close)="closeDetail()"
      (addToOrder)="onAddToOrder($event)"
    ></app-menu-item-detail>
  `
})
export class MenuPageComponent {
  showDetail = false;
  selectedItem: MenuItem | null = null;
  customizationOptions = [];

  showItemDetail(item: MenuItem) {
    this.selectedItem = item;
    this.showDetail = true;
  }

  closeDetail() {
    this.showDetail = false;
    this.selectedItem = null;
  }

  onAddToOrder(customization: MenuCustomization) {
    // Handle order customization
  }
}
```

### Service Usage

```typescript
// Using the MenuService directly
import { MenuService } from '@app/frontend-modules-menu';

@Component({
  // ...
})
export class CustomMenuComponent {
  constructor(private menuService: MenuService) {}

  ngOnInit() {
    // Load menu data
    this.menuService.loadCompleteMenu('cafe-id').subscribe();

    // Access reactive data
    effect(() => {
      console.log('Categories:', this.menuService.categories());
      console.log('Filtered items:', this.menuService.filteredItems());
      console.log('Loading:', this.menuService.loading());
    });
  }

  searchItems(query: string) {
    this.menuService.updateFilters({ search: query });
  }

  selectCategory(categoryId: string) {
    const category = this.menuService.categories().find(c => c.id === categoryId);
    this.menuService.selectCategory(category);
  }
}
```

## API Reference

### MenuDisplayComponent

#### Inputs
- `cafeId: string` - Required cafe identifier
- `cafeName: string` - Display name for the restaurant
- `initialCategoryId?: string` - Pre-select a category

#### Outputs
- `itemSelected: EventEmitter<MenuItem>` - Emitted when item is clicked
- `addToCart: EventEmitter<MenuItem>` - Emitted when add to cart is clicked
- `retryLoad: EventEmitter<void>` - Emitted when retry button is clicked

### MenuItemDetailComponent

#### Inputs
- `visible: boolean` - Controls dialog visibility
- `menuItem: MenuItem | null` - Item to display
- `displayOptions: MenuItemDetailOptions` - Display configuration
- `enableSpecialRequests: boolean` - Allow special request notes
- `customizationOptions: CustomizationOption[]` - Available customizations

#### Outputs
- `close: EventEmitter<void>` - Emitted when dialog is closed
- `addToOrder: EventEmitter<MenuCustomization>` - Emitted when order is placed

### MenuService

#### Signals (Read-only)
- `categories()` - Available menu categories
- `menuItems()` - All menu items
- `filteredItems()` - Filtered and sorted items
- `selectedCategory()` - Currently selected category
- `selectedMenuItem()` - Currently selected item
- `filters()` - Active filters
- `sortOptions()` - Current sort configuration
- `displayOptions()` - Display preferences
- `loading()` - Loading state
- `error()` - Error message
- `cart()` - Shopping cart items

#### Methods
- `loadCategories(cafeId: string)` - Load menu categories
- `loadMenuItems(cafeId: string, categoryId?: string)` - Load menu items
- `loadCompleteMenu(cafeId: string)` - Load categories and items
- `searchItems(cafeId: string, query: string)` - Search menu items
- `updateFilters(filters: Partial<MenuFilters>)` - Update active filters
- `clearFilters()` - Clear all filters
- `selectCategory(category?: MenuCategory)` - Select category
- `addToCart(customization: MenuCustomization)` - Add item to cart
- `updateDisplayOptions(options: Partial<MenuDisplayOptions>)` - Update display preferences

## Types

### MenuItem
```typescript
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  status: MenuItemStatus;
  preparationTime?: number;
  imageUrl?: string;
  nutritionalInfo?: Record<string, any>;
  allergens?: string[];
  sortOrder: number;
  cafeId: string;
  categoryId?: string;
  category?: MenuCategory;
}
```

### MenuCategory
```typescript
interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  cafeId: string;
  menuItems?: MenuItem[];
}
```

### MenuCustomization
```typescript
interface MenuCustomization {
  itemId: string;
  notes?: string;
  customizations?: Record<string, any>;
  quantity: number;
}
```

## Styling

The components use PrimeNG's CSS variables for theming. You can customize the appearance by overriding CSS custom properties:

```scss
:root {
  --primary-color: #your-brand-color;
  --surface-ground: #your-background-color;
  // ... other theme variables
}
```

## Dependencies

- Angular 18+
- PrimeNG 18+
- Apollo Angular (for GraphQL)
- RxJS 7+

## Testing

Run tests with:
```bash
nx test frontend-modules-menu
```

Tests include:
- Unit tests for all components and services
- Integration tests for GraphQL operations
- Accessibility testing
- Responsive behavior testing

## Performance

- Uses Angular signals for reactive state management
- Implements virtual scrolling for large menus
- Lazy loads images with error handling
- Debounces search input
- Caches GraphQL queries
- Optimized for mobile performance

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

See the main project's contributing guidelines.