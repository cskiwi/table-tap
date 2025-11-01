import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleButtonModule } from 'primeng/togglebutton';

import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminService } from '../../services/admin.service';
import { InventoryAlert } from '../../types/admin.types';
import { Apollo } from 'apollo-angular';

interface InventoryItem {
  id: string,
  sku: string,
  itemName: string
  description?: string
  category: string,
  currentStock: number,
  minimumStock: number
  maximumStock?: number
  unitCost: number,
  unit: string
  supplier?: string
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  expiryDate?: Date
  lastUpdated: Date,
  isLowStock: boolean,
  isOutOfStock: boolean,
  stockValue: number
}

@Component({
  selector: 'tt-inventory-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    TagModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    ProgressBarModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
    DividerModule,
    ChartModule,
    ToastModule,
    FileUploadModule,
    MultiSelectModule,
    ToggleButtonModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './inventory-management.component.html',
})
export class InventoryManagementComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private apollo = inject(Apollo);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // State
  loading = signal(false);
  searchTerm = '';
  selectedCategory: string | null = null;
  selectedStatus: string | null = null;
  selectedStockLevel: string | null = null;
  showOnlyAlerts = false;

  // Dialog state
  showItemDialog = false;
  showStockDialog = false;
  showImportDialog = false;
  isEditMode = false;
  selectedItem: InventoryItem | null = null;
  selectedFile: File | null = null;

  // Stock adjustment
  adjustmentType: 'ADD' | 'SUBTRACT' = 'ADD';
  adjustmentQuantity = 1;
  adjustmentReason = '';
  adjustmentNotes = '';

  // Form
  itemForm: FormGroup = this.fb.group({
    itemName: ['', Validators.required],
    sku: ['', Validators.required],
    category: ['', Validators.required],
    description: [''],
    currentStock: [0, [Validators.required, Validators.min(0)]],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
    maximumStock: [''],
    unitCost: [0, [Validators.required, Validators.min(0)]],
    unit: ['', Validators.required],
    supplier: [''],
    expiryDate: [''],
  });

  // Real inventory data from GraphQL
  private allItems = signal<InventoryItem[]>([]);

  // Filter options
  categoryOptions = [
    { label: 'Coffee', value: 'Coffee' },
  { label: 'Dairy', value: 'Dairy' },
  { label: 'Sweeteners', value: 'Sweeteners' },
  { label: 'Snacks', value: 'Snacks' },
  { label: 'Supplies', value: 'Supplies'
  }
  ];
  statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Discontinued', value: 'DISCONTINUED'
  }
  ];
  stockLevelOptions = [
    { label: 'Low Stock', value: 'LOW' },
  { label: 'Out of Stock', value: 'OUT' },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Overstocked', value: 'HIGH'
  }
  ];
  adjustmentReasons = [
    { label: 'Delivery', value: 'DELIVERY' },
  { label: 'Sale', value: 'SALE' },
  { label: 'Waste', value: 'WASTE' },
  { label: 'Damage', value: 'DAMAGE' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Correction', value: 'CORRECTION'
  }
  ];
  // Computed values
  filteredItems = computed(() => {
    let items = this.allItems()

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase()
      items = items.filter(item =>
        item.itemName.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        item.supplier?.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      items = items.filter(item => item.category === this.selectedCategory);
    }

    // Apply status filter
    if (this.selectedStatus) {
      items = items.filter(item => item.status === this.selectedStatus);
    }

    // Apply stock level filter
    if (this.selectedStockLevel) {
      switch (this.selectedStockLevel) {
        case 'LOW':
          items = items.filter(item => item.isLowStock);
          break;
        case 'OUT':
          items = items.filter(item => item.isOutOfStock);
          break;
        case 'NORMAL':
          items = items.filter(item => !item.isLowStock && !item.isOutOfStock);
          break;
        case 'HIGH':
          items = items.filter(item =>
            item.maximumStock && item.currentStock > item.maximumStock * 0.9
          );
          break;
      }
    }

    // Show only alerts filter
    if (this.showOnlyAlerts) {
      items = items.filter(item => item.isLowStock || item.isOutOfStock);
    }

    return items;
  });

  inventoryMetrics = computed(() => {
    const items = this.allItems()
    return {
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + item.stockValue, 0),
      lowStockItems: items.filter(item => item.isLowStock).length,
      outOfStockItems: items.filter(item => item.isOutOfStock).length,
      expiringSoon: items.filter(item =>
        item.expiryDate && this.isExpiringSoon(item.expiryDate)
      ).length
    }
  });

  criticalAlerts = computed(() => {
    return this.adminService.inventoryAlerts().filter(alert =>
      alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
    );
  });

  ngOnInit(): void {
    this.loadInventory()
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  loadInventory(): void {
    this.loading.set(true);

    // Get cafeId from adminService
    const cafeId = this.adminService.selectedCafeId();
    if (!cafeId) {
      this.loading.set(false);
      return;
    }

    import('../../graphql/admin.operations').then(({ GET_INVENTORY_ITEMS }) => {
      this.apollo.query<{ inventoryItems: InventoryItem[] }>({
        query: GET_INVENTORY_ITEMS,
        variables: { cafeId },
      }).subscribe({
        next: (result) => {
          this.allItems.set(result.data.inventoryItems);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading inventory:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load inventory items'
          });
          this.loading.set(false);
        }
      });
    });
  }

  refreshInventory(): void {
    this.loadInventory()
    this.messageService.add({
      severity: 'success',
      summary: 'Refreshed',
      detail: 'Inventory has been refreshed',
    });
  }

  onSearch(): void {
    // Search is handled by computed filteredItems
  }

  applyFilters(): void {
    // Filters are handled by computed filteredItems
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = null;
    this.selectedStatus = null;
    this.selectedStockLevel = null;
    this.showOnlyAlerts = false;
  }

  addNewItem(): void {
    this.isEditMode = false;
    this.itemForm.reset()
    this.showItemDialog = true;
  }

  editItem(item: InventoryItem): void {
    this.isEditMode = true;
    this.selectedItem = item;
    this.itemForm.patchValue(item);
    this.showItemDialog = true;
  }

  saveItem(): void {
    if (this.itemForm.valid) {
      const formValue = this.itemForm.value;

      if (this.isEditMode && this.selectedItem) {
        // Update existing item
        const updatedItems = this.allItems().map(item =>
          item.id === this.selectedItem!.id
            ? { ...item, ...formValue, lastUpdated: new Date() }
            : item
        );
        this.allItems.set(updatedItems);

        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: `${formValue.itemName} has been updated`
        });
      } else {
        // Add new item
        const newItem: InventoryItem = {
          id: Date.now().toString(),
          ...formValue,
          stockValue: formValue.currentStock * formValue.unitCost,
          isLowStock: formValue.currentStock <= formValue.minimumStock,
          isOutOfStock: formValue.currentStock === 0,
          lastUpdated: new Date()
        }

        this.allItems.update(items => [...items, newItem]);

        this.messageService.add({
          severity: 'success',
          summary: 'Created',
          detail: `${formValue.itemName} has been added to inventory`
        });
      }

      this.showItemDialog = false;
    }
  }

  adjustStock(item: InventoryItem, type: 'ADD' | 'SUBTRACT'): void {
    this.selectedItem = item;
    this.adjustmentType = type;
    this.adjustmentQuantity = 1;
    this.adjustmentReason = '';
    this.adjustmentNotes = '';
    this.showStockDialog = true;
  }

  confirmStockAdjustment(): void {
    if (this.selectedItem && this.adjustmentQuantity > 0) {
      const newStock = this.adjustmentType === 'ADD'
        ? this.selectedItem.currentStock + this.adjustmentQuantity
        : Math.max(0, this.selectedItem.currentStock - this.adjustmentQuantity);

      const updatedItems = this.allItems().map(item =>
        item.id === this.selectedItem!.id
          ? {
              ...item,
              currentStock: newStock,
              stockValue: newStock * item.unitCost,
              isLowStock: newStock <= item.minimumStock && newStock > 0,
              isOutOfStock: newStock === 0,
              lastUpdated: new Date()
            }
          : item
      );

      this.allItems.set(updatedItems);

      this.messageService.add({
        severity: 'success',
        summary: 'Stock Updated',
        detail: `${this.selectedItem.itemName} stock ${this.adjustmentType === 'ADD' ? 'increased' : 'decreased'} by ${this.adjustmentQuantity}`
      });

      this.showStockDialog = false;
    }
  }

  deleteItem(item: InventoryItem): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${item.itemName}?`,
      accept: () => {
        const updatedItems = this.allItems().filter(i => i.id !== item.id);
        this.allItems.set(updatedItems);

        this.messageService.add({
          severity: 'info',
          summary: 'Deleted',
          detail: `${item.itemName} has been removed from inventory`
        });
      }
    });
  }

  updateItemStock(sku: string): void {
    const item = this.allItems().find(i => i.sku === sku);
    if (item) {
      this.adjustStock(item, 'ADD');
    }
  }

  dismissAlert(alertId: string): void {
    this.adminService.dismissAlert(alertId);
  }

  resolveAllAlerts(): void {
    this.criticalAlerts().forEach(alert => {
      this.adminService.dismissAlert(alert.id);
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Alerts Resolved',
      detail: 'All critical alerts have been resolved',
    });
  }

  exportInventory(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Exporting',
      detail: 'Inventory export has started',
    });
  }

  onFileSelect(event: any): void {
    this.selectedFile = event.files[0]
  }

  downloadTemplate(): void {
    // Create and download CSV template
    const csvContent = 'SKU,Item Name,Category,Current Stock,Minimum Stock,Unit Cost,Unit,Description,Supplier\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click()
    window.URL.revokeObjectURL(url);
  }

  importInventory(): void {
    if (this.selectedFile) {
      this.messageService.add({
        severity: 'success',
        summary: 'Import Started',
        detail: 'Processing inventory file...',
      });

      this.showImportDialog = false;
      this.selectedFile = null;
    }
  }

  // Utility methods
  getStockPercentage(item: InventoryItem): number {
    if (item.maximumStock) {
      return Math.min(100, (item.currentStock / item.maximumStock) * 100);
    }
    return item.currentStock > item.minimumStock ? 100 : (item.currentStock / item.minimumStock) * 100;
  }

  getStockSeverity(item: InventoryItem): "info" | "success" | "warn" | "secondary" | "contrast" | "danger" {
    if (item.isOutOfStock) return 'danger';
    if (item.isLowStock) return 'warn';
    return 'success';
  }

  getStatusSeverity(status: string): "info" | "success" | "warn" | "secondary" | "contrast" | "danger" {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warn';
      case 'DISCONTINUED': return 'danger';
      default: return 'secondary';
    }
  }

  isExpired(date: Date): boolean {
    return new Date() > date;
  }

  isExpiringSoon(date: Date): boolean {
    const daysUntilExpiry = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }

  getDaysUntilExpiry(date: Date): string {
    const days = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  }
}