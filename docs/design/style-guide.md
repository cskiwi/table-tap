# TableTap Style Guide

## Overview

This style guide establishes conventions for using **PrimeNG Aura Theme** and **Tailwind CSS v4** in the TableTap application.

## Core Principles

1. **Consistency First** - Use PrimeNG components for standard UI elements
2. **Utility-Driven** - Leverage Tailwind utilities for spacing and layout
3. **Minimal Custom CSS** - Only write SCSS when necessary
4. **Theme-Aware** - Support both light and dark modes
5. **Accessible** - Maintain WCAG 2.1 AA standards

## PrimeNG Theme Usage

### When to Use PrimeNG Components

**Always use PrimeNG for:**
- ✅ Buttons (`<p-button>`)
- ✅ Cards (`<p-card>`)
- ✅ Dialogs (`<p-dialog>`)
- ✅ Tables (`<p-table>`)
- ✅ Forms (inputs, dropdowns, checkboxes)
- ✅ Menus and navigation (`<p-menubar>`, `<p-menu>`)
- ✅ Overlays (tooltips, popups)
- ✅ Loading states (`<p-progressSpinner>`, `<p-skeleton>`)
- ✅ Notifications (`<p-toast>`, `<p-message>`)

**Extend PrimeNG with Tailwind:**
```html
<!-- Good: PrimeNG component + Tailwind utilities -->
<p-card styleClass="mb-4 shadow-lg">
  <div class="flex gap-4 items-center">
    <p-button label="Save" severity="primary"></p-button>
  </div>
</p-card>
```

### PrimeNG Component Conventions

#### Button Usage

```html
<!-- Primary action -->
<p-button
  label="Submit"
  severity="primary"
  raised="true">
</p-button>

<!-- Secondary action -->
<p-button
  label="Cancel"
  severity="secondary"
  outlined="true">
</p-button>

<!-- Danger/Delete action -->
<p-button
  label="Delete"
  severity="danger"
  icon="pi pi-trash">
</p-button>

<!-- Icon-only button -->
<p-button
  icon="pi pi-search"
  rounded="true"
  text="true"
  ariaLabel="Search">
</p-button>
```

**Button Severity Guide:**
- `primary` - Main action (Save, Submit, Create)
- `secondary` - Secondary action (Cancel, Back)
- `success` - Success confirmation (Confirm, Approve)
- `danger` - Destructive action (Delete, Remove)
- `warn` - Warning action (Caution required)
- `info` - Informational action
- `help` - Help or support action

#### Card Usage

```html
<!-- Basic card -->
<p-card header="Card Title">
  Content goes here
</p-card>

<!-- Card with custom header and footer -->
<p-card>
  <ng-template pTemplate="header">
    <div class="flex justify-between items-center p-4">
      <h3 class="text-xl font-semibold">Title</h3>
      <p-button icon="pi pi-cog" text="true"></p-button>
    </div>
  </ng-template>

  <div class="space-y-4">
    Content
  </div>

  <ng-template pTemplate="footer">
    <div class="flex justify-end gap-2">
      <p-button label="Cancel" severity="secondary"></p-button>
      <p-button label="Save" severity="primary"></p-button>
    </div>
  </ng-template>
</p-card>
```

#### Form Input Usage

```html
<!-- Text input -->
<div class="flex flex-col gap-2">
  <label for="email" class="font-medium">Email</label>
  <input
    pInputText
    id="email"
    type="email"
    placeholder="Enter your email"
    class="w-full">
</div>

<!-- Dropdown -->
<div class="flex flex-col gap-2">
  <label for="category" class="font-medium">Category</label>
  <p-dropdown
    [options]="categories"
    [(ngModel)]="selectedCategory"
    placeholder="Select a category"
    [style]="{ width: '100%' }">
  </p-dropdown>
</div>

<!-- Checkbox -->
<div class="flex items-center gap-2">
  <p-checkbox
    [(ngModel)]="checked"
    [binary]="true"
    inputId="agree">
  </p-checkbox>
  <label for="agree" class="cursor-pointer">I agree to terms</label>
</div>
```

### Theme Variables

Use PrimeNG CSS variables for consistent theming:

```scss
.custom-element {
  // Colors
  color: var(--text-color);
  background: var(--surface-ground);
  border-color: var(--surface-border);

  // Typography
  font-family: var(--font-family);

  // Spacing
  padding: var(--content-padding);
  border-radius: var(--border-radius);

  // Transitions
  transition-duration: var(--transition-duration);
}
```

**Common Theme Variables:**
```css
/* Surface Colors */
--surface-ground     /* Page background */
--surface-section    /* Section background */
--surface-card       /* Card background */
--surface-overlay    /* Overlay background */
--surface-border     /* Border color */
--surface-hover      /* Hover background */

/* Text Colors */
--text-color         /* Primary text */
--text-color-secondary /* Secondary text */
--primary-color-text /* Primary button text */

/* Primary Colors */
--primary-color      /* Primary brand color */
--primary-50 to --primary-900 /* Primary shades */

/* Component Specific */
--content-padding    /* Standard padding */
--border-radius      /* Standard border radius */
--transition-duration /* Standard transition */
```

## Tailwind CSS Conventions

### Layout & Spacing

**Use Tailwind spacing scale consistently:**

```html
<!-- Spacing scale: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 -->

<!-- Small gaps -->
<div class="flex gap-2">...</div>

<!-- Medium gaps -->
<div class="flex gap-4">...</div>

<!-- Large gaps -->
<div class="flex gap-6">...</div>

<!-- Container padding -->
<div class="p-4 md:p-6 lg:p-8">...</div>

<!-- Margins -->
<div class="mb-4">...</div>
<div class="mt-6">...</div>
```

**Grid Layouts:**

```html
<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Items -->
</div>

<!-- Auto-fit grid -->
<div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
  <!-- Items -->
</div>
```

**Flexbox Layouts:**

```html
<!-- Horizontal layout with alignment -->
<div class="flex items-center justify-between gap-4">
  <div>Left</div>
  <div>Right</div>
</div>

<!-- Vertical stack -->
<div class="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Centered content -->
<div class="flex items-center justify-center min-h-screen">
  <div>Centered</div>
</div>
```

### Typography

**Font Sizes:**
```html
<!-- Headings -->
<h1 class="text-4xl font-bold">Main Title</h1>
<h2 class="text-3xl font-semibold">Section</h2>
<h3 class="text-2xl font-semibold">Subsection</h3>
<h4 class="text-xl font-medium">Minor Heading</h4>

<!-- Body text -->
<p class="text-base">Normal text</p>
<p class="text-sm text-gray-600">Small secondary text</p>
<p class="text-xs text-gray-500">Extra small text</p>
```

**Font Weights:**
- `font-normal` (400) - Body text
- `font-medium` (500) - Labels, subtle emphasis
- `font-semibold` (600) - Headings, strong emphasis
- `font-bold` (700) - Titles, very strong emphasis

### Color Palette

**Primary Colors (Blue):**
```html
<!-- Backgrounds -->
<div class="bg-blue-50">Lightest</div>
<div class="bg-blue-900">Primary brand (darkest)</div>

<!-- Text -->
<span class="text-blue-600">Link color</span>
<span class="text-blue-900">Primary text</span>
```

**Neutral Colors (Gray):**
```html
<!-- Backgrounds -->
<div class="bg-gray-50">Light background</div>
<div class="bg-gray-100">Section background</div>
<div class="bg-gray-900">Dark background</div>

<!-- Text -->
<span class="text-gray-900">Primary text</span>
<span class="text-gray-600">Secondary text</span>
<span class="text-gray-400">Disabled text</span>

<!-- Borders -->
<div class="border border-gray-300">Standard border</div>
```

**Semantic Colors:**
```html
<!-- Success (Green) -->
<div class="bg-green-50 text-green-700 border border-green-300">
  Success message
</div>

<!-- Warning (Yellow/Orange) -->
<div class="bg-yellow-50 text-yellow-700 border border-yellow-300">
  Warning message
</div>

<!-- Error (Red) -->
<div class="bg-red-50 text-red-700 border border-red-300">
  Error message
</div>

<!-- Info (Blue) -->
<div class="bg-blue-50 text-blue-700 border border-blue-300">
  Info message
</div>
```

### Responsive Design

**Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

```html
<!-- Mobile-first approach -->
<div class="
  grid
  grid-cols-1       <!-- Mobile: 1 column -->
  md:grid-cols-2    <!-- Tablet: 2 columns -->
  lg:grid-cols-3    <!-- Desktop: 3 columns -->
  gap-4
">
  Items
</div>

<!-- Show/hide based on screen size -->
<div class="hidden md:block">Desktop only</div>
<div class="block md:hidden">Mobile only</div>

<!-- Responsive padding -->
<div class="p-4 md:p-6 lg:p-8">Content</div>

<!-- Responsive text -->
<h1 class="text-2xl md:text-3xl lg:text-4xl">Title</h1>
```

### Borders & Shadows

**Borders:**
```html
<!-- Border width -->
<div class="border">Default border</div>
<div class="border-2">Thick border</div>

<!-- Border radius -->
<div class="rounded-sm">Small radius (2px)</div>
<div class="rounded-md">Medium radius (6px)</div>
<div class="rounded-lg">Large radius (8px)</div>
<div class="rounded-xl">Extra large (12px)</div>
<div class="rounded-full">Fully rounded</div>

<!-- Directional borders -->
<div class="border-t">Top border only</div>
<div class="border-b border-gray-200">Bottom border</div>
```

**Shadows:**
```html
<div class="shadow-sm">Subtle shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-xl">Extra large shadow</div>

<!-- Hover effect -->
<div class="shadow-md hover:shadow-lg transition-shadow">
  Card with hover
</div>
```

## When to Use SCSS vs Utility Classes

### Use Tailwind Utilities For:
✅ Spacing (padding, margin, gap)
✅ Layout (flex, grid)
✅ Typography (font size, weight, color)
✅ Backgrounds and borders
✅ Basic responsive design
✅ Simple hover states

### Use SCSS For:
✅ Complex animations and transitions
✅ Deep PrimeNG component customization (`:ng-deep`)
✅ Complex pseudo-selectors
✅ Dynamic theming logic
✅ Component-specific complex patterns

### Example: When to Use SCSS

**Good use of SCSS:**
```scss
:host ::ng-deep .p-card {
  // Complex hover animation
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);

    .p-card-header {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-400));
    }
  }
}

// Complex keyframe animation
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification {
  animation: slideIn 0.3s ease-out;
}
```

**Bad use of SCSS (use Tailwind instead):**
```scss
// ❌ Don't do this - use Tailwind utilities
.container {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
}

// ✅ Do this instead
// <div class="flex gap-4 p-6 bg-white rounded-lg">
```

## Component-Specific Guidelines

### Wrapping PrimeNG Components

When creating wrapper components:

```typescript
@Component({
  selector: 'tabletap-button',
  template: `
    <p-button
      [label]="label"
      [icon]="icon"
      [severity]="severity"
      [styleClass]="buttonClass">
    </p-button>
  `,
  styles: [`
    // Minimal custom styling
    :host ::ng-deep .p-button.fullwidth {
      width: 100%;
    }
  `]
})
export class ButtonComponent {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() severity = 'primary';
  @Input() fullwidth = false;

  get buttonClass(): string {
    return this.fullwidth ? 'fullwidth' : '';
  }
}
```

### Dark Mode Support

Always test components with dark mode:

```html
<!-- Component should work with both themes -->
<div class="bg-surface-ground text-text-color p-4">
  This adapts to light/dark mode automatically
</div>
```

**Testing dark mode:**
```typescript
// Add .dark-theme class to body
document.body.classList.add('dark-theme');
```

## Common Patterns

### Card with Actions

```html
<p-card>
  <ng-template pTemplate="header">
    <div class="flex justify-between items-center p-4">
      <h3 class="text-xl font-semibold">Order #1234</h3>
      <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
        Completed
      </span>
    </div>
  </ng-template>

  <div class="space-y-4">
    <div class="flex justify-between">
      <span class="text-gray-600">Total:</span>
      <span class="font-semibold">$24.99</span>
    </div>
  </div>

  <ng-template pTemplate="footer">
    <div class="flex justify-end gap-2">
      <p-button label="View Details" severity="secondary" outlined="true"></p-button>
      <p-button label="Reorder" severity="primary"></p-button>
    </div>
  </ng-template>
</p-card>
```

### Data Table

```html
<p-table
  [value]="orders"
  [paginator]="true"
  [rows]="10"
  [rowsPerPageOptions]="[10, 25, 50]"
  styleClass="p-datatable-striped">

  <ng-template pTemplate="header">
    <tr>
      <th class="text-left">Order ID</th>
      <th class="text-left">Customer</th>
      <th class="text-right">Total</th>
      <th class="text-center">Status</th>
      <th class="text-center">Actions</th>
    </tr>
  </ng-template>

  <ng-template pTemplate="body" let-order>
    <tr>
      <td class="font-medium">{{ order.id }}</td>
      <td>{{ order.customerName }}</td>
      <td class="text-right">\${{ order.total }}</td>
      <td class="text-center">
        <span [class]="getStatusClass(order.status)">
          {{ order.status }}
        </span>
      </td>
      <td class="text-center">
        <p-button
          icon="pi pi-eye"
          severity="secondary"
          text="true"
          (onClick)="viewOrder(order)">
        </p-button>
      </td>
    </tr>
  </ng-template>
</p-table>
```

### Form Layout

```html
<form class="space-y-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="flex flex-col gap-2">
      <label for="firstName" class="font-medium">First Name</label>
      <input
        pInputText
        id="firstName"
        class="w-full"
        placeholder="John">
    </div>

    <div class="flex flex-col gap-2">
      <label for="lastName" class="font-medium">Last Name</label>
      <input
        pInputText
        id="lastName"
        class="w-full"
        placeholder="Doe">
    </div>
  </div>

  <div class="flex flex-col gap-2">
    <label for="email" class="font-medium">Email</label>
    <input
      pInputText
      id="email"
      type="email"
      class="w-full"
      placeholder="john.doe@example.com">
  </div>

  <div class="flex justify-end gap-2">
    <p-button label="Cancel" severity="secondary"></p-button>
    <p-button label="Save" severity="primary"></p-button>
  </div>
</form>
```

## Accessibility Guidelines

1. **Always provide labels** for form inputs
2. **Use semantic HTML** (header, main, nav, footer)
3. **Include ARIA attributes** when needed
4. **Ensure keyboard navigation** works
5. **Maintain color contrast** (WCAG AA minimum)
6. **Provide alt text** for images
7. **Use focus indicators** (don't remove outlines)

```html
<!-- Good accessibility -->
<div class="flex flex-col gap-2">
  <label for="search" class="font-medium">Search</label>
  <input
    pInputText
    id="search"
    type="text"
    placeholder="Search items..."
    aria-label="Search items"
    class="w-full">
</div>

<!-- Button with icon -->
<p-button
  icon="pi pi-trash"
  severity="danger"
  ariaLabel="Delete item"
  text="true">
</p-button>
```

## File Organization

```
component/
├── component.component.ts        # Component logic
├── component.component.html      # Template (PrimeNG + Tailwind)
├── component.component.scss      # Minimal SCSS (if needed)
└── component.component.spec.ts   # Tests
```

**Minimize SCSS files:**
- If component only uses Tailwind utilities, omit `.scss` file
- Only create `.scss` when truly necessary

## Code Review Checklist

- [ ] Uses PrimeNG components where appropriate
- [ ] Applies Tailwind utilities for layout/spacing
- [ ] Minimal custom SCSS (justifiable)
- [ ] Responsive design implemented
- [ ] Dark mode compatible
- [ ] Accessible (labels, ARIA, keyboard nav)
- [ ] Consistent with style guide
- [ ] No hardcoded colors (use theme variables or Tailwind)

## Resources

- [PrimeNG Documentation](https://primeng.org/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Aura Theme Variables](https://primeng.org/theming#primeuix)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Last Updated

**Date**: 2025-10-03
**Version**: 1.0.0
**Maintained By**: TableTap Development Team
