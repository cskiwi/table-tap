# Mobile App Design Specifications - Table Tap (Capacitor)

## App Architecture Overview

The Table Tap mobile app is built using Capacitor to provide native mobile capabilities while maintaining a single codebase with the web application.

### Platform Features
- **iOS**: Native navigation patterns, haptic feedback, Face ID/Touch ID
- **Android**: Material design elements, back button handling, system notifications
- **Cross-platform**: Camera access, geolocation, push notifications, offline storage

## App Structure

### Core Navigation
```
Tab Navigation (Bottom)
├── 🏠 Home (Restaurant discovery)
├── 📍 Near Me (Location-based)
├── 🛒 Orders (Order history & tracking)
└── 👤 Profile (Settings & preferences)

Secondary Screens
├── QR Scanner
├── Menu Browser
├── Order Checkout
├── Order Tracking
├── Restaurant Details
└── Settings
```

## Screen Specifications

### 1. Launch & Onboarding

#### Splash Screen
```typescript
interface SplashScreenConfig {
  backgroundColor: '#E67E22';  // Primary brand color
  showSpinner: boolean;
  androidSplashResourceName: 'splash';
  iosSplashResourceName: 'Default';
}
```

**Visual Specifications:**
- Logo: White Table Tap logo centered
- Background: Primary orange gradient
- Loading indicator: Subtle white spinner below logo
- Duration: 2-3 seconds maximum
- Fade transition to main app

#### Onboarding Flow
```
Screen 1: Welcome
- Hero illustration: Restaurant scene
- Title: "Order food with ease"
- Subtitle: "Scan, order, enjoy"
- CTA: "Get Started"

Screen 2: QR Code Feature
- Illustration: Phone scanning QR code
- Title: "Scan to order"
- Subtitle: "No app downloads required"
- CTA: "Try it now"

Screen 3: Location & Notifications
- Permission requests
- Benefits explanation
- CTA: "Enable & Continue"
```

### 2. Home Screen (Restaurant Discovery)

#### Layout Structure
```html
<div class="home-screen bg-gray-50 min-h-screen">
  <!-- Header -->
  <header class="bg-white px-4 py-3 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">TableTap</h1>
        <p class="text-sm text-gray-600">📍 Current location</p>
      </div>
      <button class="p-2 rounded-lg bg-gray-100">
        <i class="pi pi-search"></i>
      </button>
    </div>
  </header>

  <!-- Quick Actions -->
  <section class="px-4 py-4">
    <div class="grid grid-cols-3 gap-3">
      <button class="bg-white p-4 rounded-xl shadow-sm text-center">
        <div class="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center">
          <i class="pi pi-qrcode text-primary text-xl"></i>
        </div>
        <span class="text-sm font-medium">Scan QR</span>
      </button>

      <button class="bg-white p-4 rounded-xl shadow-sm text-center">
        <div class="w-12 h-12 bg-blue-50 rounded-full mx-auto mb-2 flex items-center justify-center">
          <i class="pi pi-map-marker text-blue-500 text-xl"></i>
        </div>
        <span class="text-sm font-medium">Near Me</span>
      </button>

      <button class="bg-white p-4 rounded-xl shadow-sm text-center">
        <div class="w-12 h-12 bg-green-50 rounded-full mx-auto mb-2 flex items-center justify-center">
          <i class="pi pi-heart text-green-500 text-xl"></i>
        </div>
        <span class="text-sm font-medium">Favorites</span>
      </button>
    </div>
  </section>

  <!-- Restaurant List -->
  <section class="px-4 pb-20">
    <h2 class="text-lg font-semibold mb-4">Restaurants near you</h2>
    <div class="space-y-4">
      <!-- Restaurant cards -->
    </div>
  </section>
</div>
```

#### Restaurant Card Component
```typescript
interface RestaurantCard {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  distance: string;
  estimatedTime: string;
  priceRange: '$' | '$$' | '$$$';
  image: string;
  isOpen: boolean;
  specialOffers?: string[];
}
```

```html
<div class="restaurant-card bg-white rounded-xl shadow-sm overflow-hidden">
  <div class="relative">
    <img [src]="restaurant.image" class="w-full h-32 object-cover">
    <div class="absolute top-3 left-3">
      <span class="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
        {{restaurant.estimatedTime}}
      </span>
    </div>
    <div class="absolute top-3 right-3">
      <button class="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
        <i class="pi pi-heart text-gray-400"></i>
      </button>
    </div>
  </div>

  <div class="p-4">
    <div class="flex items-start justify-between mb-2">
      <div>
        <h3 class="font-semibold text-gray-900">{{restaurant.name}}</h3>
        <p class="text-sm text-gray-600">{{restaurant.cuisine}} • {{restaurant.priceRange}}</p>
      </div>
      <div class="flex items-center">
        <i class="pi pi-star-fill text-yellow-400 text-xs mr-1"></i>
        <span class="text-sm font-medium">{{restaurant.rating}}</span>
        <span class="text-xs text-gray-500 ml-1">({{restaurant.reviewCount}})</span>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-600">📍 {{restaurant.distance}}</span>
      <div class="flex space-x-2">
        <button class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
          View Menu
        </button>
        <button class="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
          Order Now
        </button>
      </div>
    </div>
  </div>
</div>
```

### 3. QR Code Scanner

#### Native Camera Integration
```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

@Component({
  selector: 'app-qr-scanner',
  template: `
    <div class="scanner-container">
      <div class="scanner-overlay">
        <div class="scanner-frame"></div>
        <div class="scanner-instructions">
          <p>Point your camera at the QR code on your table</p>
        </div>
      </div>

      <div class="scanner-controls">
        <button (click)="toggleFlashlight()" class="control-btn">
          <i class="pi pi-lightbulb"></i>
          Flash
        </button>

        <button (click)="openGallery()" class="control-btn">
          <i class="pi pi-image"></i>
          Gallery
        </button>

        <button (click)="enterManually()" class="control-btn">
          <i class="pi pi-pencil"></i>
          Manual
        </button>
      </div>
    </div>
  `
})
export class QrScannerComponent {
  async startScan() {
    const allowed = await this.checkPermissions();
    if (allowed) {
      await BarcodeScanner.hideBackground();
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        this.handleScanResult(result.content);
      }
    }
  }
}
```

#### Scanner Styles
```css
.scanner-container {
  @apply relative h-screen bg-black;
}

.scanner-overlay {
  @apply absolute inset-0 flex flex-col items-center justify-center;
}

.scanner-frame {
  @apply w-64 h-64 border-2 border-white rounded-2xl;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
}

.scanner-instructions {
  @apply mt-8 text-center text-white px-8;
}

.scanner-controls {
  @apply absolute bottom-20 left-0 right-0 flex justify-center space-x-8;
}

.control-btn {
  @apply flex flex-col items-center text-white bg-black/50 backdrop-blur-sm
         w-16 h-16 rounded-full justify-center;
}
```

### 4. Menu Interface

#### Category Navigation
```html
<div class="menu-screen bg-gray-50 min-h-screen">
  <!-- Sticky Header -->
  <header class="sticky top-0 bg-white shadow-sm z-10">
    <div class="px-4 py-3">
      <div class="flex items-center justify-between mb-3">
        <button class="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <i class="pi pi-arrow-left text-xl"></i>
        </button>
        <h1 class="font-semibold">{{restaurant.name}}</h1>
        <button class="p-2 -mr-2 rounded-lg hover:bg-gray-100 relative">
          <i class="pi pi-shopping-cart text-xl"></i>
          <span class="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {{cartCount}}
          </span>
        </button>
      </div>

      <!-- Search -->
      <div class="relative">
        <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        <input
          type="text"
          placeholder="Search menu items..."
          class="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="px-4">
      <div class="flex space-x-1 overflow-x-auto pb-3">
        <button
          *ngFor="let category of categories"
          [class.active]="category.id === activeCategory"
          class="category-tab">
          <span class="category-icon">{{category.icon}}</span>
          <span class="category-name">{{category.name}}</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Menu Items -->
  <main class="px-4 py-4 pb-20">
    <div class="space-y-4">
      <app-menu-item-card
        *ngFor="let item of filteredItems"
        [item]="item"
        (addToCart)="onAddToCart($event)"
        (viewDetails)="onViewDetails($event)">
      </app-menu-item-card>
    </div>
  </main>
</div>
```

#### Enhanced Menu Item Card (Mobile)
```html
<div class="menu-item-card bg-white rounded-xl shadow-sm overflow-hidden">
  <div class="flex">
    <!-- Image -->
    <div class="w-24 h-24 flex-shrink-0">
      <img [src]="item.image" [alt]="item.name" class="w-full h-full object-cover rounded-l-xl">
    </div>

    <!-- Content -->
    <div class="flex-1 p-4">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-semibold text-gray-900 line-clamp-1">{{item.name}}</h3>
        <span class="font-bold text-primary ml-2">${{item.price}}</span>
      </div>

      <p class="text-sm text-gray-600 line-clamp-2 mb-3">{{item.description}}</p>

      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <i class="pi pi-star-fill text-yellow-400 text-xs mr-1"></i>
          <span class="text-sm font-medium">{{item.rating}}</span>
          <span class="text-xs text-gray-500 ml-1">({{item.reviewCount}})</span>
        </div>

        <button
          (click)="onAddToCart()"
          [disabled]="!item.available"
          class="bg-primary hover:bg-primary-dark disabled:bg-gray-300
                 text-white font-medium py-2 px-4 rounded-lg text-sm
                 transition-colors duration-200">
          <i class="pi pi-plus mr-1"></i>
          Add
        </button>
      </div>
    </div>
  </div>
</div>
```

### 5. Order Tracking

#### Real-time Order Status
```html
<div class="order-tracking bg-gray-50 min-h-screen">
  <!-- Header -->
  <header class="bg-white px-4 py-3 shadow-sm">
    <div class="flex items-center">
      <button class="p-2 -ml-2 rounded-lg hover:bg-gray-100">
        <i class="pi pi-arrow-left text-xl"></i>
      </button>
      <h1 class="ml-3 font-semibold">Order #{{order.id}}</h1>
    </div>
  </header>

  <!-- Order Status Timeline -->
  <section class="bg-white mx-4 mt-4 rounded-xl shadow-sm p-6">
    <h2 class="font-semibold mb-4">Order Status</h2>

    <div class="space-y-4">
      <div
        *ngFor="let status of orderStatuses; let i = index"
        class="flex items-start"
        [class.active]="status.completed"
        [class.current]="status.current">

        <!-- Status Icon -->
        <div class="status-icon">
          <i *ngIf="status.completed" class="pi pi-check text-white"></i>
          <i *ngIf="status.current && !status.completed" class="pi pi-clock text-primary"></i>
          <div *ngIf="!status.current && !status.completed" class="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>

        <!-- Status Content -->
        <div class="ml-4 flex-1">
          <h3 class="font-medium" [class.text-primary]="status.current">{{status.title}}</h3>
          <p class="text-sm text-gray-600">{{status.description}}</p>
          <span *ngIf="status.timestamp" class="text-xs text-gray-400">{{status.timestamp | date:'short'}}</span>
        </div>

        <!-- Estimated Time -->
        <div *ngIf="status.estimatedTime" class="text-right">
          <span class="text-sm font-medium text-primary">{{status.estimatedTime}}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Order Details -->
  <section class="bg-white mx-4 mt-4 rounded-xl shadow-sm p-6">
    <h2 class="font-semibold mb-4">Order Details</h2>

    <div class="space-y-3">
      <div *ngFor="let item of order.items" class="flex justify-between">
        <div>
          <span class="font-medium">{{item.name}} x{{item.quantity}}</span>
          <div *ngIf="item.customizations" class="text-sm text-gray-600">
            {{item.customizations.join(', ')}}
          </div>
        </div>
        <span class="font-medium">${{item.total}}</span>
      </div>
    </div>

    <div class="border-t pt-3 mt-3">
      <div class="flex justify-between font-semibold">
        <span>Total</span>
        <span>${{order.total}}</span>
      </div>
    </div>
  </section>

  <!-- Actions -->
  <section class="p-4">
    <div class="space-y-3">
      <button class="w-full bg-primary text-white font-medium py-3 rounded-xl">
        Contact Restaurant
      </button>

      <button *ngIf="canCancel" class="w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-xl">
        Cancel Order
      </button>
    </div>
  </section>
</div>
```

### 6. Profile & Settings

#### User Profile Screen
```html
<div class="profile-screen bg-gray-50 min-h-screen">
  <!-- Header -->
  <header class="bg-white px-4 py-6">
    <div class="text-center">
      <div class="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-3 overflow-hidden">
        <img *ngIf="user.avatar" [src]="user.avatar" class="w-full h-full object-cover">
        <i *ngIf="!user.avatar" class="pi pi-user text-2xl text-gray-600 flex items-center justify-center h-full"></i>
      </div>
      <h1 class="font-semibold text-lg">{{user.name || 'Guest User'}}</h1>
      <p class="text-gray-600">{{user.email}}</p>
    </div>
  </header>

  <!-- Menu Items -->
  <section class="px-4 py-4 space-y-4">
    <!-- Order History -->
    <div class="bg-white rounded-xl shadow-sm">
      <button class="w-full p-4 flex items-center justify-between text-left">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-3">
            <i class="pi pi-clock text-blue-500"></i>
          </div>
          <span class="font-medium">Order History</span>
        </div>
        <i class="pi pi-chevron-right text-gray-400"></i>
      </button>
    </div>

    <!-- Favorites -->
    <div class="bg-white rounded-xl shadow-sm">
      <button class="w-full p-4 flex items-center justify-between text-left">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mr-3">
            <i class="pi pi-heart text-red-500"></i>
          </div>
          <span class="font-medium">Favorite Restaurants</span>
        </div>
        <i class="pi pi-chevron-right text-gray-400"></i>
      </button>
    </div>

    <!-- Settings -->
    <div class="bg-white rounded-xl shadow-sm">
      <button class="w-full p-4 flex items-center justify-between text-left">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mr-3">
            <i class="pi pi-cog text-gray-500"></i>
          </div>
          <span class="font-medium">Settings</span>
        </div>
        <i class="pi pi-chevron-right text-gray-400"></i>
      </button>
    </div>

    <!-- Support -->
    <div class="bg-white rounded-xl shadow-sm">
      <button class="w-full p-4 flex items-center justify-between text-left">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mr-3">
            <i class="pi pi-question-circle text-green-500"></i>
          </div>
          <span class="font-medium">Help & Support</span>
        </div>
        <i class="pi pi-chevron-right text-gray-400"></i>
      </button>
    </div>
  </section>
</div>
```

## Native Features Integration

### 1. Push Notifications
```typescript
import { PushNotifications } from '@capacitor/push-notifications';

@Injectable()
export class NotificationService {
  async initializePushNotifications() {
    // Request permission
    const permission = await PushNotifications.requestPermissions();

    if (permission.receive === 'granted') {
      await PushNotifications.register();
    }

    // Handle registration
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      this.sendTokenToServer(token.value);
    });

    // Handle notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      this.handleNotification(notification);
    });
  }

  private handleNotification(notification: any) {
    // Show in-app notification for order updates
    this.toastService.show({
      severity: 'info',
      summary: notification.title,
      detail: notification.body,
      life: 5000
    });
  }
}
```

### 2. Geolocation Services
```typescript
import { Geolocation } from '@capacitor/geolocation';

@Injectable()
export class LocationService {
  async getCurrentLocation(): Promise<Position> {
    const permissions = await Geolocation.requestPermissions();

    if (permissions.location === 'granted') {
      return await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
    }

    throw new Error('Location permission denied');
  }

  async findNearbyRestaurants(radius: number = 5000) {
    const position = await this.getCurrentLocation();

    return this.restaurantService.findByLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      radius
    });
  }
}
```

### 3. Haptic Feedback
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable()
export class HapticService {
  async lightImpact() {
    await Haptics.impact({ style: ImpactStyle.Light });
  }

  async mediumImpact() {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }

  async heavyImpact() {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  }

  async vibrate(duration: number = 300) {
    await Haptics.vibrate({ duration });
  }
}
```

## Platform-Specific Considerations

### iOS Specific
- **Safe Area**: Account for notch and bottom indicator
- **Navigation**: Swipe back gesture support
- **Haptics**: Use system haptic feedback
- **Permissions**: Request at appropriate moments

### Android Specific
- **Back Button**: Handle hardware back button
- **Material Design**: Use appropriate elevation and shadows
- **Notifications**: Handle notification channels
- **Permissions**: Progressive permission requests

### App Icons & Splash Screens

#### Icon Sizes Required
```
iOS:
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 152x152 (iPad @2x)
- 76x76 (iPad @1x)

Android:
- 512x512 (Play Store)
- 192x192 (xxxhdpi)
- 144x144 (xxhdpi)
- 96x96 (xhdpi)
- 72x72 (hdpi)
- 48x48 (mdpi)
```

## Performance Optimizations

### Lazy Loading
```typescript
const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'menu',
    loadChildren: () => import('./pages/menu/menu.module').then(m => m.MenuPageModule)
  },
  {
    path: 'orders',
    loadChildren: () => import('./pages/orders/orders.module').then(m => m.OrdersPageModule)
  }
];
```

### Image Optimization
```typescript
@Component({
  template: `
    <img
      [src]="optimizedImageUrl"
      [alt]="item.name"
      loading="lazy"
      class="w-full h-32 object-cover">
  `
})
export class MenuItemComponent {
  get optimizedImageUrl(): string {
    const baseUrl = this.item.image;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = 300 * devicePixelRatio;

    return `${baseUrl}?w=${width}&q=80&fm=webp`;
  }
}
```

This comprehensive mobile app specification provides everything needed to implement a native mobile experience using Capacitor while maintaining consistency with the overall Table Tap design system.