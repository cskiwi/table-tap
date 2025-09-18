# Responsive Design Guidelines - Table Tap Restaurant Ordering System

## Mobile-First Approach

All interfaces are designed starting with mobile constraints and progressively enhanced for larger screens.

### Core Principles:
1. **Touch-First Design**: All interactive elements optimized for finger navigation
2. **Content Hierarchy**: Most important content visible without scrolling
3. **Performance Priority**: Minimal assets and efficient loading
4. **Progressive Enhancement**: Features added as screen real estate increases

## Breakpoint System

### Primary Breakpoints
```css
/* Mobile First Base Styles */
.container {
  width: 100%;
  padding: 1rem;
  margin: 0 auto;
}

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) {
  .container {
    max-width: 540px;
  }
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
  .container {
    max-width: 720px;
    padding: 1.5rem;
  }
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
  .container {
    max-width: 960px;
    padding: 2rem;
  }
}

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) {
  .container {
    max-width: 1140px;
  }
}
```

### Tailwind CSS Breakpoint Usage
```css
<!-- Mobile first responsive classes -->
<div class="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6">
  <!-- Content adapts at each breakpoint -->
</div>

<!-- Navigation responsive pattern -->
<nav class="fixed bottom-0 md:static md:top-0 w-full md:w-auto">
  <!-- Bottom nav on mobile, top nav on desktop -->
</nav>
```

## Layout Patterns by Interface

### 1. Customer Ordering Interface

#### Mobile (< 768px)
- **Single column layout**
- **Bottom navigation bar**
- **Full-width cards**
- **Sticky header with search**
- **Floating cart button**

```html
<div class="min-h-screen pb-16"> <!-- Account for bottom nav -->
  <!-- Header -->
  <header class="sticky top-0 z-40 bg-white shadow-sm p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">Menu</h1>
      <div class="relative">
        <input class="w-full pl-10 pr-4 py-2 rounded-lg border"
               placeholder="Search menu...">
      </div>
    </div>
  </header>

  <!-- Content -->
  <main class="p-4 space-y-4">
    <!-- Menu items in single column -->
    <div class="space-y-4">
      <!-- Menu item cards -->
    </div>
  </main>

  <!-- Bottom Navigation -->
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t">
    <!-- Navigation items -->
  </nav>

  <!-- Floating Cart -->
  <button class="fixed bottom-20 right-4 bg-primary rounded-full p-4 shadow-lg">
    <!-- Cart icon and count -->
  </button>
</div>
```

#### Tablet (768px - 1024px)
- **Two-column layout**
- **Sidebar navigation**
- **Grid-based menu display**
- **Sticky cart summary**

```html
<div class="flex min-h-screen">
  <!-- Sidebar Navigation -->
  <aside class="w-64 bg-gray-50 border-r">
    <!-- Category navigation -->
  </aside>

  <!-- Main Content Area -->
  <main class="flex-1 flex">
    <!-- Menu Grid -->
    <div class="flex-1 p-6">
      <div class="grid grid-cols-2 gap-6">
        <!-- Menu item cards -->
      </div>
    </div>

    <!-- Cart Sidebar -->
    <aside class="w-80 bg-white border-l p-6 sticky top-0 h-screen overflow-y-auto">
      <!-- Cart contents -->
    </aside>
  </main>
</div>
```

#### Desktop (> 1024px)
- **Three-column layout**
- **Top navigation bar**
- **Grid-based menu (3-4 columns)**
- **Persistent cart sidebar**

### 2. Counter/Kitchen Display System

#### Mobile/Tablet (Portrait)
- **Single column order queue**
- **Swipe gestures for status updates**
- **Collapsible order details**
- **Touch-optimized controls**

#### Large Display (Landscape)
- **Multi-column order grid**
- **Time-based color coding**
- **Drag and drop functionality**
- **Full order details visible**

```html
<!-- Mobile Kitchen Display -->
<div class="p-4 space-y-4 md:hidden">
  <div class="space-y-3">
    <!-- Single column orders -->
    <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-400">
      <!-- Order details -->
      <div class="flex justify-between items-center">
        <span class="font-medium">Order #1234</span>
        <span class="text-sm text-gray-500">5 min ago</span>
      </div>
      <!-- Swipe actions -->
      <div class="mt-3 flex space-x-2">
        <button class="flex-1 bg-orange-100 text-orange-700 py-2 rounded">
          In Progress
        </button>
        <button class="flex-1 bg-green-100 text-green-700 py-2 rounded">
          Ready
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Desktop Kitchen Display -->
<div class="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
  <!-- Multi-column order grid -->
  <div class="space-y-4">
    <h3 class="font-semibold text-gray-700">New Orders</h3>
    <!-- Orders in this column -->
  </div>
  <div class="space-y-4">
    <h3 class="font-semibold text-orange-700">In Progress</h3>
    <!-- Orders in this column -->
  </div>
  <!-- More columns -->
</div>
```

### 3. Dashboard Interfaces

#### Mobile Dashboard
- **Card-based layout**
- **Scrollable metrics**
- **Hamburger menu**
- **Bottom sheet for actions**

#### Desktop Dashboard
- **Grid-based widgets**
- **Sidebar navigation**
- **Modular layout**
- **Drag and drop customization**

```html
<!-- Mobile Dashboard -->
<div class="min-h-screen bg-gray-50">
  <!-- Header with hamburger menu -->
  <header class="bg-white shadow-sm p-4 flex items-center">
    <button class="mr-4 md:hidden">
      <!-- Hamburger icon -->
    </button>
    <h1 class="text-xl font-bold">Dashboard</h1>
  </header>

  <!-- Scrollable content -->
  <main class="p-4 pb-20">
    <!-- Key metrics cards -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg shadow-sm">
        <!-- Metric card -->
      </div>
    </div>

    <!-- Charts and tables -->
    <div class="space-y-6">
      <!-- Full-width components -->
    </div>
  </main>
</div>

<!-- Desktop Dashboard -->
<div class="flex min-h-screen bg-gray-50">
  <!-- Sidebar -->
  <aside class="w-64 bg-white shadow-sm">
    <!-- Navigation menu -->
  </aside>

  <!-- Main content -->
  <main class="flex-1 p-6">
    <!-- Dashboard grid -->
    <div class="grid grid-cols-12 gap-6">
      <!-- Flexible widget grid -->
      <div class="col-span-12 lg:col-span-8">
        <!-- Main chart -->
      </div>
      <div class="col-span-12 lg:col-span-4">
        <!-- Side widgets -->
      </div>
    </div>
  </main>
</div>
```

## Component Responsive Patterns

### Navigation Components

#### Mobile Navigation
```html
<!-- Bottom Tab Navigation -->
<nav class="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
  <div class="flex">
    <a class="flex-1 flex flex-col items-center py-2 px-1 text-center">
      <svg class="w-6 h-6 mb-1"><!-- Icon --></svg>
      <span class="text-xs">Menu</span>
    </a>
    <!-- More tabs -->
  </div>
</nav>

<!-- Hamburger Sidebar -->
<div class="fixed inset-0 z-50 md:hidden" [class.hidden]="!sidebarOpen">
  <!-- Overlay -->
  <div class="absolute inset-0 bg-gray-600 bg-opacity-50"></div>

  <!-- Sidebar -->
  <nav class="relative flex flex-col w-64 h-full bg-white shadow-xl">
    <!-- Navigation content -->
  </nav>
</div>
```

#### Desktop Navigation
```html
<!-- Top Navigation Bar -->
<nav class="hidden md:flex bg-white shadow-sm px-6 py-4">
  <div class="flex items-center justify-between w-full">
    <div class="flex items-center space-x-8">
      <img src="/logo.svg" class="h-8">
      <div class="flex space-x-6">
        <a class="text-gray-700 hover:text-primary">Menu</a>
        <a class="text-gray-700 hover:text-primary">Orders</a>
        <!-- More nav items -->
      </div>
    </div>
    <div class="flex items-center space-x-4">
      <!-- User menu, notifications -->
    </div>
  </div>
</nav>
```

### Form Responsive Patterns

```html
<!-- Responsive Form Layout -->
<form class="space-y-4 md:space-y-6">
  <!-- Single column on mobile, two columns on desktop -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
    <div>
      <label class="block text-sm font-medium mb-2">First Name</label>
      <input class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
    </div>
    <div>
      <label class="block text-sm font-medium mb-2">Last Name</label>
      <input class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
    </div>
  </div>

  <!-- Full width on mobile -->
  <div>
    <label class="block text-sm font-medium mb-2">Email</label>
    <input class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary">
  </div>

  <!-- Responsive button layout -->
  <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
    <button class="w-full sm:w-auto px-6 py-2 border rounded-lg">Cancel</button>
    <button class="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-lg">Save</button>
  </div>
</form>
```

### Table Responsive Patterns

```html
<!-- Mobile: Card Layout -->
<div class="md:hidden space-y-4">
  <div class="bg-white rounded-lg p-4 shadow-sm">
    <div class="flex justify-between items-start mb-2">
      <span class="font-medium">Order #1234</span>
      <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Completed</span>
    </div>
    <div class="text-sm text-gray-600 space-y-1">
      <div>Customer: John Doe</div>
      <div>Total: $24.50</div>
      <div>Time: 2:30 PM</div>
    </div>
  </div>
</div>

<!-- Desktop: Table Layout -->
<div class="hidden md:block overflow-x-auto">
  <table class="w-full bg-white rounded-lg shadow-sm">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200">
      <!-- Table rows -->
    </tbody>
  </table>
</div>
```

## Touch Optimization

### Touch Target Sizes
```css
/* Minimum touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Spacing between touch targets */
.touch-spacing {
  margin: 8px;
}

/* Large touch areas for primary actions */
.touch-large {
  min-height: 56px;
  min-width: 56px;
}
```

### Gesture Support
- **Swipe**: Navigation between screens, order status updates
- **Pull-to-refresh**: Refresh order lists, inventory data
- **Long press**: Context menus, quick actions
- **Pinch/zoom**: Menu item details, charts

## Performance Considerations

### Image Optimization
```html
<!-- Responsive images with WebP support -->
<picture>
  <source srcset="/images/menu-item-small.webp" media="(max-width: 768px)" type="image/webp">
  <source srcset="/images/menu-item-large.webp" media="(min-width: 769px)" type="image/webp">
  <source srcset="/images/menu-item-small.jpg" media="(max-width: 768px)">
  <img src="/images/menu-item-large.jpg" alt="Menu item" class="w-full h-auto rounded-lg">
</picture>
```

### Lazy Loading
```html
<!-- Implement intersection observer for lazy loading -->
<img loading="lazy"
     src="/images/placeholder.jpg"
     data-src="/images/actual-image.jpg"
     class="w-full h-48 object-cover rounded-lg">
```

### Conditional Loading
```typescript
// Load components based on viewport size
const MobileComponent = lazy(() => import('./MobileComponent'));
const DesktopComponent = lazy(() => import('./DesktopComponent'));

const ResponsiveComponent = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth < 768);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {isMobile ? <MobileComponent /> : <DesktopComponent />}
    </Suspense>
  );
};
```

These responsive design patterns ensure optimal user experience across all device types while maintaining performance and accessibility standards.