# PrimeNG & Tailwind Migration Guide

## Overview

This guide documents the migration from traditional SCSS styling to a modern hybrid approach using **PrimeNG Aura Theme** with **Tailwind CSS v4** utilities.

## Migration Approach

### Hybrid Strategy

We use a **best-of-both-worlds** approach:

1. **PrimeNG Aura Theme**: Provides consistent, themeable UI components with CSS variables
2. **Tailwind CSS v4**: Utility-first classes for spacing, layout, and custom styling
3. **SCSS for Complex Patterns**: Component-specific styles when utilities aren't sufficient

## Step-by-Step Migration Process

### Phase 1: Setup & Configuration

#### 1.1 Install Dependencies

```bash
npm install primeng@^20.2.0 @primeuix/themes@^1.2.3 tailwindcss-primeui@^0.6.1
npm install -D @tailwindcss/postcss@^4.1.13
```

#### 1.2 Configure Tailwind v4

**apps/app/src/styles.scss:**
```scss
@use "primeicons/primeicons.css";
@use 'tailwindcss';
@plugin 'tailwindcss-primeui';

@layer base, components, primeng, utilities;
```

#### 1.3 Configure PrimeNG Theme

**apps/app/config/app.config.ts:**
```typescript
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-theme',
        },
      },
    }),
  ],
};
```

### Phase 2: Component Migration

#### 2.1 Before Migration Example

**Old Approach (Pure SCSS):**
```scss
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}

.button-primary {
  background: #1e3a8a;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;

  &:hover {
    background: #1e40af;
  }
}
```

#### 2.2 After Migration Example

**New Approach (PrimeNG + Tailwind):**

**Component Template:**
```html
<!-- Using PrimeNG Card Component -->
<p-card styleClass="hoverable">
  <ng-template pTemplate="header">
    <h3 class="text-xl font-semibold">Card Title</h3>
  </ng-template>

  <div class="space-y-4">
    <p class="text-gray-600">Card content goes here</p>
  </div>

  <ng-template pTemplate="footer">
    <p-button
      label="Submit"
      severity="primary"
      raised="true">
    </p-button>
  </ng-template>
</p-card>
```

**Component SCSS (minimal):**
```scss
:host ::ng-deep .p-card.hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## PrimeNG Class Reference

### Core PrimeNG Components

#### Card Component

**Basic Usage:**
```html
<p-card
  [header]="'Title'"
  [subheader]="'Subtitle'"
  [styleClass]="'custom-class'">
  Content
</p-card>
```

**PrimeNG CSS Classes:**
- `.p-card` - Main card container
- `.p-card-header` - Header section
- `.p-card-body` - Main content area
- `.p-card-footer` - Footer section
- `.p-card-content` - Content wrapper

**Custom Variants:**
```typescript
// In shared/ui/cards/card.component.ts
variant: 'default' | 'elevated' | 'bordered' | 'flat' = 'default';
padding: 'compact' | 'default' | 'spacious' = 'default';
```

#### Button Component

**Basic Usage:**
```html
<p-button
  [label]="'Click Me'"
  [icon]="'pi pi-check'"
  [severity]="'primary'"
  [raised]="true">
</p-button>
```

**PrimeNG CSS Classes:**
- `.p-button` - Base button class
- `.p-button-label` - Button text
- `.p-button-icon` - Icon wrapper
- `.p-button-loading-icon` - Loading state icon

**Severity Variants:**
- `primary` - Primary action (blue)
- `secondary` - Secondary action (gray)
- `success` - Success action (green)
- `info` - Info action (light blue)
- `warn` - Warning action (orange)
- `danger` - Danger/delete action (red)
- `help` - Help action (purple)
- `contrast` - High contrast

**Style Modifiers:**
- `raised` - Elevated appearance
- `rounded` - Rounded corners
- `text` - Text-only button
- `outlined` - Outline style

#### Other Common Components

**Dialog:**
```html
<p-dialog
  [header]="'Dialog Title'"
  [(visible)]="displayDialog"
  [modal]="true"
  [draggable]="false">
  Content
</p-dialog>
```

**Table:**
```html
<p-table [value]="data" [paginator]="true">
  <ng-template pTemplate="header">
    <tr>
      <th>Name</th>
      <th>Email</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-item>
    <tr>
      <td>{{ item.name }}</td>
      <td>{{ item.email }}</td>
    </tr>
  </ng-template>
</p-table>
```

## Tailwind Class Mapping

### Layout & Spacing

| SCSS | Tailwind v4 |
|------|-------------|
| `display: flex;` | `flex` |
| `flex-direction: column;` | `flex-col` |
| `justify-content: space-between;` | `justify-between` |
| `align-items: center;` | `items-center` |
| `gap: 1rem;` | `gap-4` |
| `padding: 1rem;` | `p-4` |
| `margin: 0.5rem;` | `m-2` |

### Typography

| SCSS | Tailwind v4 |
|------|-------------|
| `font-size: 1.5rem;` | `text-2xl` |
| `font-weight: 600;` | `font-semibold` |
| `font-weight: 700;` | `font-bold` |
| `text-align: center;` | `text-center` |
| `color: #374151;` | `text-gray-700` |

### Colors (Using Tailwind)

| Purpose | Tailwind Class |
|---------|----------------|
| Primary Background | `bg-blue-900` |
| Secondary Background | `bg-gray-100` |
| Text Primary | `text-gray-900` |
| Text Secondary | `text-gray-600` |
| Border | `border-gray-300` |
| Hover Background | `hover:bg-gray-50` |

### Sizing

| SCSS | Tailwind v4 |
|------|-------------|
| `width: 100%;` | `w-full` |
| `height: 2rem;` | `h-8` |
| `min-width: 300px;` | `min-w-[300px]` |
| `max-width: 1200px;` | `max-w-7xl` |

### Borders & Shadows

| SCSS | Tailwind v4 |
|------|-------------|
| `border-radius: 6px;` | `rounded-md` |
| `border: 1px solid;` | `border` |
| `box-shadow: 0 2px 4px...;` | `shadow-sm` |
| `box-shadow: 0 4px 12px...;` | `shadow-md` |

## Common Migration Patterns

### Pattern 1: Header Component

**Before:**
```scss
.header {
  background: #1e3a8a;
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

**After:**
```html
<header class="bg-blue-900 text-white px-4 py-3 flex justify-between items-center">
  <!-- Header content -->
</header>
```

### Pattern 2: Card Grid

**Before:**
```scss
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}
```

**After:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
  <!-- Grid items -->
</div>
```

### Pattern 3: Responsive Utilities

**Before:**
```scss
.nav {
  display: flex;

  @media (max-width: 768px) {
    display: none;
  }
}
```

**After:**
```html
<nav class="hidden md:flex">
  <!-- Navigation -->
</nav>
```

## PrimeNG Theme Variables

### Accessing CSS Variables

PrimeNG Aura theme provides CSS variables for consistent theming:

```scss
// Use PrimeNG theme variables
.custom-element {
  color: var(--text-color);
  background: var(--surface-ground);
  border-color: var(--surface-border);
  border-radius: var(--border-radius);
}
```

### Common Theme Variables

```css
/* Colors */
--primary-color
--primary-color-text
--surface-ground
--surface-section
--surface-card
--text-color
--text-color-secondary

/* Borders */
--surface-border
--border-radius

/* Transitions */
--transition-duration
```

## Component-Specific SCSS

When to use SCSS:

1. **Complex hover effects** that can't be achieved with Tailwind
2. **Deep PrimeNG component customization** using `::ng-deep`
3. **Animation keyframes**
4. **Complex media queries** beyond responsive utilities

### Example: Custom Card Hover

```scss
:host ::ng-deep .p-card.hoverable {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
```

## Before/After Examples

### Example 1: Login Form

**Before (Pure SCSS):**
```html
<div class="login-container">
  <form class="login-form">
    <h2 class="form-title">Login</h2>
    <div class="form-group">
      <input type="email" class="form-input" placeholder="Email">
    </div>
    <button type="submit" class="submit-btn">Sign In</button>
  </form>
</div>
```

```scss
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background: #1e3a8a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
```

**After (PrimeNG + Tailwind):**
```html
<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <p-card styleClass="w-full max-w-md">
    <ng-template pTemplate="header">
      <h2 class="text-2xl font-semibold text-center">Login</h2>
    </ng-template>

    <form class="space-y-4">
      <div class="flex flex-col gap-2">
        <label for="email" class="font-medium">Email</label>
        <input
          pInputText
          id="email"
          type="email"
          placeholder="Email"
          class="w-full">
      </div>

      <p-button
        label="Sign In"
        severity="primary"
        [style]="{ width: '100%' }">
      </p-button>
    </form>
  </p-card>
</div>
```

### Example 2: Navigation Menu

**Before:**
```html
<nav class="navbar">
  <a class="nav-link" routerLink="/">Home</a>
  <a class="nav-link active" routerLink="/menu">Menu</a>
  <a class="nav-link" routerLink="/orders">Orders</a>
</nav>
```

```scss
.navbar {
  display: flex;
  gap: 0.5rem;
  background: #1e3a8a;
  padding: 1rem;
}

.nav-link {
  padding: 0.5rem 1rem;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: rgba(255, 255, 255, 0.15);
    font-weight: 600;
  }
}
```

**After:**
```html
<nav class="flex gap-2 bg-blue-900 p-4">
  <a
    routerLink="/"
    routerLinkActive="active"
    class="nav-link">
    Home
  </a>
  <a
    routerLink="/menu"
    routerLinkActive="active"
    class="nav-link">
    Menu
  </a>
  <a
    routerLink="/orders"
    routerLinkActive="active"
    class="nav-link">
    Orders
  </a>
</nav>
```

```scss
.nav-link {
  @apply px-4 py-2 text-white rounded-md transition-colors;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: rgba(255, 255, 255, 0.15);
    @apply font-semibold;
  }
}
```

## Migration Checklist

- [ ] Install PrimeNG, Aura theme, and Tailwind CSS v4
- [ ] Configure `styles.scss` with Tailwind imports
- [ ] Set up PrimeNG theme in `app.config.ts`
- [ ] Replace custom buttons with `<p-button>`
- [ ] Replace custom cards with `<p-card>`
- [ ] Convert layout CSS to Tailwind utilities
- [ ] Update spacing with Tailwind spacing scale
- [ ] Replace color values with Tailwind color classes or PrimeNG variables
- [ ] Convert typography to Tailwind text utilities
- [ ] Update responsive styles with Tailwind breakpoints
- [ ] Keep complex animations in SCSS
- [ ] Test dark mode with `.dark-theme` selector
- [ ] Validate accessibility with new components

## Best Practices

1. **Use PrimeNG components first** for standard UI elements (buttons, cards, dialogs)
2. **Use Tailwind utilities** for layout, spacing, and basic styling
3. **Use SCSS sparingly** for complex patterns and PrimeNG customization
4. **Leverage CSS variables** from PrimeNG theme for consistent theming
5. **Test responsive behavior** with Tailwind's breakpoint system
6. **Maintain accessibility** - PrimeNG components have built-in ARIA support

## Resources

- [PrimeNG Documentation](https://primeng.org/)
- [PrimeNG Aura Theme](https://primeng.org/theming#primeuix)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [TailwindCSS PrimeUI Plugin](https://github.com/primefaces/tailwindcss-primeui)

## Next Steps

After migration:
1. Review component registry for migration status
2. Run build and fix any style-related errors
3. Test all components in both light and dark themes
4. Update style guide with team conventions
5. Document any custom patterns in the troubleshooting guide
