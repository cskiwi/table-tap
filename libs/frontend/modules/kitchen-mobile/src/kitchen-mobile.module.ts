import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ListboxModule } from 'primeng/listbox';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FloatLabelModule } from 'primeng/floatlabel';

// CDK Modules
import { LayoutModule } from '@angular/cdk/layout';
import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';

// Components
import { KitchenMobileDashboardComponent } from './components/dashboard/kitchen-mobile-dashboard.component';
import { KitchenOrderCardComponent } from './components/order-card/kitchen-order-card.component';

// Services
import { OfflineStorageService } from './services/storage/offline-storage.service';
import { OfflineSyncService } from './services/sync/offline-sync.service';
import { VoiceRecognitionService } from './services/voice/voice-recognition.service';
import { BarcodeScannerService } from './services/barcode/barcode-scanner.service';
import { TimerService } from './services/timer.service';
import { PushNotificationService } from './services/notifications/push-notification.service';
import { GestureService } from './services/gesture.service';
import { KitchenDataService } from './services/kitchen-data.service';

@NgModule({
  imports: [
    // Standalone Components
    KitchenMobileDashboardComponent,
    KitchenOrderCardComponent,

    // Angular Core
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,

    // Service Worker
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: true, // Will be dynamically configured
      registrationStrategy: 'registerWhenStable:30000'
    }),

    // PrimeNG
    ButtonModule,
    CardModule,
    ProgressBarModule,
    ChipModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    ToastModule,
    DialogModule,
    ListboxModule,
    DividerModule,
    ProgressSpinnerModule,
    TooltipModule,
    BadgeModule,
    SelectButtonModule,
    FloatLabelModule,

    // CDK
    LayoutModule,
    A11yModule,
    DragDropModule,
    ScrollingModule
  ],
  providers: [
    // Kitchen Mobile Services
    OfflineStorageService,
    OfflineSyncService,
    VoiceRecognitionService,
    BarcodeScannerService,
    TimerService,
    PushNotificationService,
    GestureService,
    KitchenDataService
  ],
  exports: [
    KitchenMobileDashboardComponent,
    KitchenOrderCardComponent
  ]
})
export class KitchenMobileModule {}

// PWA Configuration Module
@NgModule({
  imports: [
    KitchenMobileModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: true,
      registrationStrategy: 'registerWhenStable:30000',
      scope: '/kitchen',
    })
  ],
  exports: [KitchenMobileModule],
})
export class KitchenMobilePWAModule {}