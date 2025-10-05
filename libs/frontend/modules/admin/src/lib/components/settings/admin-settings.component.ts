
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminService } from '../../services/admin.service';
import { AdminSettings } from '../../types/admin.types';

@Component({
  selector: 'tt-admin-settings',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    TabsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToggleSwitchModule,
    ButtonModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    PasswordModule,
    FileUploadModule,
    ColorPickerModule
],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-settings.component.html',
})
export class AdminSettingsComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Loading state
  saving = signal(false);

  // Theme settings
  primaryColor = '#3B82F6';
  selectedTheme = 'light';

  // Forms
  generalForm: FormGroup = this.fb.group({
    cafeName: ['TableTap Caf�', Validators.required],
    timezone: ['America/New_York', Validators.required],
    currency: ['USD', Validators.required],
    language: ['en'],
    taxRate: [8.25],
    serviceCharge: [0],
    tipSuggestions: ['15,18,20'],
  });

  operationsForm: FormGroup = this.fb.group({
    orderTimeout: [30],
    maxOrdersPerCustomer: [5],
    preparationBuffer: [5],
    autoAssignOrders: [true],
    requirePaymentConfirmation: [false],
    allowCancellations: [true],
    autoPrintReceipts: [false],
  });

  notificationsForm: FormGroup = this.fb.group({
    emailNotifications: [true],
    smsNotifications: [false],
    pushNotifications: [true],
    orderNotifications: [true],
    inventoryAlerts: [true],
    lowStockThreshold: [10],
    orderDelayThreshold: [15],
  });

  integrationsForm: FormGroup = this.fb.group({
    paymentGateway: ['stripe'],
    merchantId: [''],
    apiKey: [''],
    posSystem: ['square'],
    accountingSystem: ['quickbooks'],
    inventorySystem: ['internal'],
  });

  // Business hours
  weekDays = [
    { name: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { name: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { name: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { name: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { name: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
    { name: 'Saturday', isOpen: true, openTime: '10:00', closeTime: '16:00' },
    { name: 'Sunday', isOpen: false, openTime: '10:00', closeTime: '16:00' },
  ];

  // Options
  timezoneOptions = [
    { label: 'Eastern Time (UTC-5)', value: 'America/New_York' },
    { label: 'Central Time (UTC-6)', value: 'America/Chicago' },
    { label: 'Mountain Time (UTC-7)', value: 'America/Denver' },
    { label: 'Pacific Time (UTC-8)', value: 'America/Los_Angeles' },
  ];

  currencyOptions = [
    { label: 'US Dollar (USD)', value: 'USD' },
    { label: 'Euro (EUR)', value: 'EUR' },
    { label: 'British Pound (GBP)', value: 'GBP' },
    { label: 'Canadian Dollar (CAD)', value: 'CAD' },
  ];

  languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
  ];

  paymentGatewayOptions = [
    { label: 'Stripe', value: 'stripe' },
    { label: 'PayPal', value: 'paypal' },
    { label: 'Square', value: 'square' },
    { label: 'Authorize.Net', value: 'authorize' },
  ];

  posSystemOptions = [
    { label: 'Square', value: 'square' },
    { label: 'Toast', value: 'toast' },
    { label: 'Clover', value: 'clover' },
    { label: 'TouchBistro', value: 'touchbistro' },
  ];

  accountingSystemOptions = [
    { label: 'QuickBooks', value: 'quickbooks' },
    { label: 'Xero', value: 'xero' },
    { label: 'FreshBooks', value: 'freshbooks' },
    { label: 'Wave', value: 'wave' },
  ];

  inventorySystemOptions = [
    { label: 'Internal System', value: 'internal' },
    { label: 'BevSpot', value: 'bevspot' },
    { label: 'BlueCart', value: 'bluecart' },
    { label: 'MarketMan', value: 'marketman' },
  ];

  themeOptions = [
    { label: 'Light', value: 'light', preview: 'linear-gradient(45deg, #ffffff, #f8fafc)' },
    { label: 'Dark', value: 'dark', preview: 'linear-gradient(45deg, #1f2937, #374151)' },
    { label: 'Blue', value: 'blue', preview: 'linear-gradient(45deg, #3b82f6, #1d4ed8)' },
    { label: 'Green', value: 'green', preview: 'linear-gradient(45deg, #10b981, #059669)' },
  ];

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    const cafeId = this.adminService.selectedCafeId();
    if (cafeId) {
      this.adminService.loadSettings(cafeId).subscribe((settings) => {
        if (settings) {
          this.populateFromSettings(settings);
        }
      });
    }
  }

  populateFromSettings(settings: AdminSettings): void {
    this.generalForm.patchValue(settings.general);
    this.operationsForm.patchValue(settings.operations);
    this.notificationsForm.patchValue(settings.notifications);
    this.integrationsForm.patchValue(settings.integrations);
  }

  saveAllSettings(): void {
    this.saving.set(true);

    const settings: Partial<AdminSettings> = {
      general: this.generalForm.value,
      operations: this.operationsForm.value,
      notifications: this.notificationsForm.value,
      integrations: this.integrationsForm.value,
    };

    const cafeId = this.adminService.selectedCafeId();
    if (cafeId) {
      this.adminService.updateSettings(cafeId, settings).subscribe({
        next: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Settings Saved',
            detail: 'All settings have been saved successfully',
          });
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: 'Failed to save settings. Please try again.',
          });
        },
      });
    }
  }

  resetToDefaults(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to reset all settings to defaults? This action cannot be undone.',
      accept: () => {
        // Reset all forms to default values
        this.generalForm.reset({
          cafeName: 'TableTap Caf�',
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
          taxRate: 8.25,
          serviceCharge: 0,
          tipSuggestions: '15,18,20',
        });

        this.operationsForm.reset({
          orderTimeout: 30,
          maxOrdersPerCustomer: 5,
          preparationBuffer: 5,
          autoAssignOrders: true,
          requirePaymentConfirmation: false,
          allowCancellations: true,
          autoPrintReceipts: false,
        });

        this.notificationsForm.reset({
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          orderNotifications: true,
          inventoryAlerts: true,
          lowStockThreshold: 10,
          orderDelayThreshold: 15,
        });

        this.integrationsForm.reset({
          paymentGateway: 'stripe',
          merchantId: '',
          apiKey: '',
          posSystem: 'square',
          accountingSystem: 'quickbooks',
          inventorySystem: 'internal',
        });

        this.messageService.add({
          severity: 'info',
          summary: 'Settings Reset',
          detail: 'All settings have been reset to defaults',
        });
      },
    });
  }

  updateBusinessHours(): void {
    // Business hours logic
  }

  selectTheme(theme: string): void {
    this.selectedTheme = theme;
    // Apply theme logic
  }
}
