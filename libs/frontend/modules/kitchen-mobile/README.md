# Kitchen Mobile Module

A comprehensive mobile-optimized kitchen management system for TableTap restaurant operations.

## Features

### 🍳 Mobile-First Kitchen Dashboard
- **Touch-optimized interface** designed for phones and tablets
- **Responsive design** that adapts to different screen sizes
- **Real-time order tracking** with live updates
- **Kitchen station filtering** for organized workflow
- **Priority-based order sorting** with visual indicators

### 📱 Touch-Friendly Order Cards
- **Swipe gestures** for quick status updates
  - Swipe right: Mark ready/complete
  - Swipe left: Start/stop timer
- **Long press** for quick actions menu
- **Tap to expand** for detailed view
- **Visual feedback** with animations

### 🎤 Voice-Activated Controls
- **Speech recognition** for hands-free operation
- **Voice commands** for common tasks:
  - "Start timer"
  - "Complete order"
  - "Show grill orders"
  - "Mark ready"
- **Voice feedback** with text-to-speech
- **Noise reduction** for kitchen environments

### 📷 Barcode Scanner Integration
- **Camera-based scanning** for inventory management
- **Multiple barcode formats** supported
- **Torch control** for low-light conditions
- **Camera switching** for optimal positioning
- **File upload** scanning option

### 🔄 Offline-First Architecture
- **IndexedDB storage** for local data persistence
- **Background sync** when connection returns
- **Conflict resolution** strategies
- **Queue management** for pending operations
- **Storage optimization** with cleanup

### 🔔 Push Notifications
- **Order alerts** with customizable sounds
- **Timer expiration** warnings
- **Inventory alerts** for low stock
- **System notifications** for updates
- **Quiet hours** configuration

### ⏱️ Smart Timer System
- **Multiple timers** per order
- **Visual progress** indicators
- **Audio alerts** on completion
- **Pause/resume** functionality
- **Preset durations** for common items

### 📊 Performance Optimized
- **Lazy loading** for large order lists
- **Virtual scrolling** for performance
- **Image optimization** with WebP support
- **Bundle splitting** for faster loading
- **Service worker** caching

## Installation

```bash
# Install dependencies
npm install

# Add to your app module
import { KitchenMobileModule } from '@app/frontend-modules-kitchen-mobile';

@NgModule({
  imports: [
    KitchenMobileModule
  ]
})
export class AppModule {}
```

## Usage

### Basic Implementation

```typescript
// app.component.html
<app-kitchen-mobile-dashboard></app-kitchen-mobile-dashboard>
```

### With Configuration

```typescript
// Configure services in your app
import {
  KitchenDataService,
  VoiceRecognitionService,
  PushNotificationService
} from '@app/frontend-modules-kitchen-mobile';

export class AppComponent implements OnInit {
  constructor(
    private kitchenData: KitchenDataService,
    private voice: VoiceRecognitionService,
    private notifications: PushNotificationService
  ) {}

  async ngOnInit() {
    // Request notification permission
    await this.notifications.requestPermission();

    // Configure voice recognition
    this.voice.updateConfig({
      language: 'en-US',
      confidenceThreshold: 0.8
    });

    // Load initial data
    await this.kitchenData.refreshData();
  }
}
```

### PWA Setup

```typescript
// app.module.ts
import { KitchenMobilePWAModule } from '@app/frontend-modules-kitchen-mobile';

@NgModule({
  imports: [
    KitchenMobilePWAModule // Includes service worker configuration
  ]
})
export class AppModule {}
```

## Architecture

### Services

- **OfflineStorageService**: IndexedDB management
- **OfflineSyncService**: Background synchronization
- **VoiceRecognitionService**: Speech-to-text processing
- **BarcodeScannerService**: Camera and barcode detection
- **TimerService**: Cooking timer management
- **PushNotificationService**: Notification handling
- **GestureService**: Touch gesture recognition
- **KitchenDataService**: Data management layer

### Components

- **KitchenMobileDashboardComponent**: Main dashboard view
- **KitchenOrderCardComponent**: Individual order cards

### Types

- **KitchenOrder**: Extended order model for kitchen
- **TimerState**: Timer management state
- **VoiceCommand**: Voice recognition results
- **BarcodeScanResult**: Scan detection results
- **SyncOperation**: Offline sync operations

## Configuration

### Voice Recognition

```typescript
const voiceConfig: VoiceRecognitionConfig = {
  language: 'en-US',
  continuous: true,
  confidenceThreshold: 0.7,
  noiseReduction: true
};
```

### Barcode Scanner

```typescript
const scannerConfig: BarcodeScanConfig = {
  facingMode: 'environment',
  width: 1280,
  height: 720,
  torch: false,
  formats: ['QR_CODE', 'CODE_128', 'EAN_13']
};
```

### Offline Sync

```typescript
const syncConfig: OfflineStorageConfig = {
  maxStorageSize: 50 * 1024 * 1024, // 50MB
  maxRetryAttempts: 3,
  retryInterval: 5000,
  syncInterval: 30000
};
```

## Testing

```bash
# Run unit tests
npm run test:kitchen-mobile

# Run e2e tests
npm run e2e:kitchen-mobile

# Run tests with coverage
npm run test:kitchen-mobile:coverage
```

## Browser Support

- **Chrome/Edge**: Full support including PWA features
- **Safari**: Full support with webkit prefixes
- **Firefox**: Full support for desktop/mobile
- **iOS Safari**: PWA support with limitations
- **Android Chrome**: Full PWA support

## Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **Memory Usage**: < 50MB baseline

## Accessibility

- **WCAG 2.1 AA** compliant
- **Screen reader** support
- **High contrast** mode support
- **Reduced motion** preferences
- **Keyboard navigation** for all features

## Security

- **Content Security Policy** configured
- **XSS protection** enabled
- **Data sanitization** for user inputs
- **Secure storage** with encryption
- **API rate limiting** support

## License

This project is part of the TableTap restaurant management system.