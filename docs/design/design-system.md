# Table Tap Restaurant Ordering System - Design System

## Design Philosophy
**Clean • Modern • Friendly • Accessible**

Our design system emphasizes simplicity, efficiency, and warmth to create an inviting experience for restaurant staff and customers alike.

## Core Design Principles

### 1. Mobile-First Approach
- All interfaces designed for touch interaction
- Progressive enhancement for larger screens
- Minimum 44px touch targets
- Thumb-friendly navigation zones

### 2. Accessibility First
- WCAG 2.1 AA compliance
- High contrast ratios (4.5:1 minimum)
- Screen reader compatibility
- Keyboard navigation support
- Focus indicators on all interactive elements

### 3. Performance Focused
- Optimized component loading
- Minimal animation overhead
- Efficient data visualization
- Fast order processing workflows

## Color Palette

### Primary Colors
```css
/* Restaurant Brand Colors */
--primary: #E67E22;        /* Warm Orange - Primary Actions */
--primary-light: #F39C12;  /* Light Orange - Hover States */
--primary-dark: #D35400;   /* Dark Orange - Active States */

/* Semantic Colors */
--success: #27AE60;        /* Green - Completed Orders */
--warning: #F1C40F;        /* Yellow - Pending Orders */
--danger: #E74C3C;         /* Red - Cancelled/Alerts */
--info: #3498DB;           /* Blue - Information */
```

### Neutral Colors
```css
--gray-50: #F8FAFC;        /* Light Background */
--gray-100: #F1F5F9;       /* Card Background */
--gray-200: #E2E8F0;       /* Border Light */
--gray-300: #CBD5E1;       /* Border */
--gray-400: #94A3B8;       /* Muted Text */
--gray-500: #64748B;       /* Secondary Text */
--gray-600: #475569;       /* Primary Text */
--gray-700: #334155;       /* Headings */
--gray-800: #1E293B;       /* Dark Text */
--gray-900: #0F172A;       /* Darkest */
```

## Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Scale
```css
--text-xs: 0.75rem;     /* 12px - Captions */
--text-sm: 0.875rem;    /* 14px - Small text */
--text-base: 1rem;      /* 16px - Body text */
--text-lg: 1.125rem;    /* 18px - Large body */
--text-xl: 1.25rem;     /* 20px - Small headings */
--text-2xl: 1.5rem;     /* 24px - Headings */
--text-3xl: 1.875rem;   /* 30px - Large headings */
--text-4xl: 2.25rem;    /* 36px - Display */
```

## Spacing System
```css
/* Based on 4px grid */
--space-1: 0.25rem;     /* 4px */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
--space-10: 2.5rem;     /* 40px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
```

## Border Radius
```css
--rounded-none: 0;
--rounded-sm: 0.125rem;   /* 2px */
--rounded: 0.25rem;       /* 4px */
--rounded-md: 0.375rem;   /* 6px */
--rounded-lg: 0.5rem;     /* 8px */
--rounded-xl: 0.75rem;    /* 12px */
--rounded-2xl: 1rem;      /* 16px */
--rounded-full: 9999px;
```

## Shadow System
```css
/* Card Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Interactive Shadows */
--shadow-hover: 0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-focus: 0 0 0 3px rgba(230, 126, 34, 0.1);
```

## Responsive Breakpoints
```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small desktops */
--breakpoint-xl: 1280px;  /* Large desktops */
--breakpoint-2xl: 1536px; /* Extra large screens */
```

## Component Specifications

### Buttons
- Primary: Orange background, white text, 8px radius
- Secondary: Gray outline, gray text
- Danger: Red background, white text
- Minimum height: 44px for touch targets
- Loading states with spinner animation

### Cards
- White background with subtle shadow
- 8px border radius
- 16px padding
- Hover effect with elevated shadow

### Form Elements
- 44px minimum height
- Focus ring using primary color
- Clear error states with red messaging
- Helpful placeholder text

### Navigation
- Sticky navigation for mobile
- Clear active states
- Breadcrumb support for complex flows
- Bottom navigation for mobile apps

## Animation Guidelines

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Duration
```css
--duration-fast: 150ms;    /* Quick interactions */
--duration-normal: 200ms;  /* Standard transitions */
--duration-slow: 300ms;    /* Complex animations */
```

### Motion Principles
- Subtle and purposeful animations
- Reduced motion support for accessibility
- Loading states for async operations
- Smooth page transitions

## PrimeNG Component Usage

### Core Components
- **p-button**: All call-to-action elements
- **p-card**: Content containers and panels
- **p-table**: Order lists and data tables
- **p-sidebar**: Mobile navigation menus
- **p-toast**: Success/error notifications
- **p-dialog**: Confirmations and forms
- **p-progressbar**: Order status indicators
- **p-inputtext**: Text form fields
- **p-dropdown**: Selection inputs
- **p-checkbox**: Boolean selections

### Data Display
- **p-chart**: Analytics and reporting
- **p-badge**: Status indicators and counts
- **p-tag**: Category labels
- **p-panel**: Collapsible content sections

### Navigation
- **p-menubar**: Desktop navigation
- **p-tieredmenu**: Hierarchical menus
- **p-breadcrumb**: Navigation context
- **p-tabview**: Content organization

## Tailwind CSS Integration

### Custom Utilities
```css
@layer utilities {
  .touch-target {
    @apply min-h-[44px] min-w-[44px];
  }

  .card-hover {
    @apply transition-shadow duration-200 hover:shadow-hover;
  }

  .focus-ring {
    @apply focus:ring-2 focus:ring-primary focus:ring-opacity-50 focus:outline-none;
  }

  .text-gradient {
    @apply bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent;
  }
}
```

### Component Classes
```css
/* Button Variants */
.btn-primary {
  @apply bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg touch-target focus-ring transition-colors;
}

.btn-secondary {
  @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg touch-target focus-ring transition-colors;
}

/* Card Styles */
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6 card-hover;
}

.card-compact {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4;
}
```

## Dark Mode Support
```css
/* Dark mode color overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --gray-50: #0F172A;
    --gray-100: #1E293B;
    --gray-200: #334155;
    /* ... continue color mappings */
  }
}
```

## Accessibility Standards

### Color Contrast
- Text on background: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- Interactive elements: 3:1 minimum

### Focus Management
- Visible focus indicators on all interactive elements
- Logical tab order
- Focus trapping in modals
- Skip links for keyboard users

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for dynamic content
- Alternative text for images

### Touch Accessibility
- Minimum 44px touch targets
- Adequate spacing between interactive elements
- Gesture alternatives for all interactions
- Voice control compatibility

This design system provides the foundation for consistent, accessible, and beautiful interfaces across all restaurant ordering system components.