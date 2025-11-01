import { Component, inject, computed, signal, OnInit, OnDestroy, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { SpeedDialModule } from 'primeng/speeddial';
import { PopoverModule } from 'primeng/popover';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';

import { ConfirmationService, MessageService } from 'primeng/api';
import { Popover } from 'primeng/popover';
import { AdminService } from '../../services/admin.service';
import { Apollo } from 'apollo-angular';

interface Order {
  id: string,
  orderNumber: string,
  customerName: string
  customerEmail?: string
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  items: OrderItem[],
  totalAmount: number,
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string
  createdAt: Date
  estimatedReadyTime?: Date
  actualReadyTime?: Date
  assignedEmployeeId?: string
  assignedEmployeeName?: string
  counterId?: string
  counterName?: string
  specialInstructions?: string
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNumber?: string
}

interface OrderItem {
  id: string,
  menuItemId: string,
  menuItemName: string,
  quantity: number,
  unitPrice: number,
  totalPrice: number
  customizations?: string[]
  status: 'PENDING' | 'PREPARING' | 'READY';
}

@Component({
  selector: 'tt-order-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    TagModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    DatePickerModule,
    ProgressSpinnerModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
    DividerModule,
    BadgeModule,
    SpeedDialModule,
    PopoverModule,
    ChipModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './order-management.component.html',
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  readonly moreActionsMenu = viewChild.required<Popover>('moreActionsMenu');

  private adminService = inject(AdminService);
  private apollo = inject(Apollo);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // Loading state
  loading = signal(false);

  // Search and filters
  searchTerm = '';
  selectedStatus: string | null = null;
  selectedPaymentStatus: string | null = null;
  selectedOrderType: string | null = null;
  selectedDateRange: Date[] = []

  // Dialog state
  showOrderDialog = false;
  selectedOrder: Order | null = null;

  // Real orders data from GraphQL
  private allOrders = signal<Order[]>([]);

  // Filter options
  statusFilterOptions = [
    { label: 'Pending', value: 'PENDING' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED'
  }
  ];
  paymentStatusOptions = [
    { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED'
  }
  ];
  orderTypeOptions = [
    { label: 'Dine In', value: 'DINE_IN' },
  { label: 'Takeaway', value: 'TAKEAWAY' },
  { label: 'Delivery', value: 'DELIVERY'
  }
  ];
  // Speed dial items
  speedDialItems = [
    {
      icon: 'pi pi-plus',
      command: () => this.createNewOrder()
    },
  {
      icon: 'pi pi-refresh',
      command: () => this.refreshOrders()
    },
  {
      icon: 'pi pi-filter',
      command: () => this.clearFilters()
  }
  ];
  // Computed values
  filteredOrders = computed(() => {
    let orders = this.allOrders()

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase()
      orders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(search) ||
        order.customerName.toLowerCase().includes(search) ||
        order.customerEmail?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (this.selectedStatus) {
      orders = orders.filter(order => order.status === this.selectedStatus);
    }

    // Apply payment status filter
    if (this.selectedPaymentStatus) {
      orders = orders.filter(order => order.paymentStatus === this.selectedPaymentStatus);
    }

    // Apply order type filter
    if (this.selectedOrderType) {
      orders = orders.filter(order => order.orderType === this.selectedOrderType);
    }

    // Apply date range filter
    if (this.selectedDateRange && this.selectedDateRange.length === 2) {
      const startDate = this.selectedDateRange[0]
      const endDate = this.selectedDateRange[1]
      orders = orders.filter(order =>
        order.createdAt >= startDate && order.createdAt <= endDate
      );
    }

    return orders;
  });

  orderStatusCards = computed(() => {
    const orders = this.allOrders()
    return [
      {
        key: 'PENDING',
        label: 'Pending',
        icon: 'pi-clock',
        count: orders.filter(o => o.status === 'PENDING').length
      },
      {
        key: 'PREPARING',
        label: 'Preparing',
        icon: 'pi-cog',
        count: orders.filter(o => o.status === 'PREPARING').length
      },
      {
        key: 'READY',
        label: 'Ready',
        icon: 'pi-check-circle',
        count: orders.filter(o => o.status === 'READY').length
      },
      {
        key: 'COMPLETED',
        label: 'Completed',
        icon: 'pi-verified',
        count: orders.filter(o => o.status === 'COMPLETED').length
      }
    ];
  });

  ngOnInit(): void {
    this.loadOrders()
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
  }

  loadOrders(): void {
    this.loading.set(true);

    // Get cafeId from adminService or auth
    const cafeId = this.adminService.selectedCafeId();
    if (!cafeId) {
      this.loading.set(false);
      return;
    }

    import('../../graphql/admin.operations').then(({ GET_CAFE_ORDERS }) => {
      this.apollo.query<{ cafeOrders: Order[] }>({
        query: GET_CAFE_ORDERS,
        variables: { cafeId },
      }).subscribe({
        next: (result) => {
          this.allOrders.set(result.data.cafeOrders);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load orders'
          });
          this.loading.set(false);
        }
      });
    });
  }

  refreshOrders(): void {
    this.loadOrders()
    this.messageService.add({
      severity: 'success',
      summary: 'Refreshed',
      detail: 'Orders have been refreshed',
    });
  }

  onSearch(): void {
    // Search is handled by computed filteredOrders
  }

  applyFilters(): void {
    // Filters are handled by computed filteredOrders
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedPaymentStatus = null;
    this.selectedOrderType = null;
    this.selectedDateRange = []
  }

  filterByStatus(status: string): void {
    this.selectedStatus = this.selectedStatus === status ? null : status
  }

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDialog = true;
  }

  showOrderDetails(order: Order): void {
    this.viewOrderDetails(order);
  }

  updateOrderStatus(order: Order): void {
    const nextStatus = this.getNextStatus(order.status);
    if (nextStatus) {
      this.confirmationService.confirm({
        message: `Update order ${order.orderNumber} status to ${nextStatus}?`,
        accept: () => {
          // Update order status
          const updatedOrders = this.allOrders().map(o =>
            o.id === order.id ? { ...o, status: nextStatus as any } : o
          );
          this.allOrders.set(updatedOrders);

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Order ${order.orderNumber} updated to ${nextStatus}`
          });
        }
      });
    }
  }

  cancelOrder(order: Order): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to cancel order ${order.orderNumber}?`,
      accept: () => {
        const updatedOrders = this.allOrders().map(o =>
          o.id === order.id ? { ...o, status: 'CANCELLED' as any } : o
        );
        this.allOrders.set(updatedOrders);

        this.messageService.add({
          severity: 'info',
          summary: 'Order Cancelled',
          detail: `Order ${order.orderNumber} has been cancelled`
        });
      }
    });
  }

  createNewOrder(): void {
    this.router.navigate(['/admin/orders/new']);
  }

  exportOrders(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Exporting',
      detail: 'Orders export has started',
    });
  }

  printReceipt(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Printing',
      detail: 'Receipt sent to printer',
    });
  }

  assignEmployee(): void {
    // Open employee assignment dialog
  }

  sendOrderUpdate(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Update Sent',
      detail: 'Customer has been notified',
    });
  }

  // Utility methods
  getOrderStatusSeverity(status: string): "info" | "success" | "warn" | "secondary" | "contrast" | "danger" {
    switch (status) {
      case 'PENDING': return 'warn';
      case 'PREPARING': return 'info';
      case 'READY': return 'success';
      case 'COMPLETED': return 'secondary';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  }

  getPaymentStatusSeverity(status: string): "info" | "success" | "warn" | "secondary" | "contrast" | "danger" {
    switch (status) {
      case 'PENDING': return 'warn';
      case 'PAID': return 'success';
      case 'FAILED': return 'danger';
      case 'REFUNDED': return 'info';
      default: return 'secondary';
    }
  }

  getOrderTypeSeverity(type: string): "info" | "success" | "warn" | "secondary" | "contrast" | "danger" {
    switch (type) {
      case 'DINE_IN': return 'info';
      case 'TAKEAWAY': return 'warn';
      case 'DELIVERY': return 'success';
      default: return 'secondary';
    }
  }

  getItemStatusSeverity(status: string): "info" | "success" | "warn" | "secondary" | "contrast" | "danger" {
    switch (status) {
      case 'PENDING': return 'warn';
      case 'PREPARING': return 'info';
      case 'READY': return 'success';
      default: return 'secondary';
    }
  }

  canUpdateStatus(status: string): boolean {
    return ['PENDING', 'PREPARING'].includes(status);
  }

  canCancelOrder(status: string): boolean {
    return ['PENDING', 'PREPARING'].includes(status);
  }

  isPriorityOrder(order: Order): boolean {
    // Mark orders as priority if they're overdue
    if (order.estimatedReadyTime) {
      return new Date() > order.estimatedReadyTime && order.status !== 'COMPLETED';
    }
    return false;
  }

  getNextStatus(currentStatus: string): string | null {
    const statusFlow = {
      'PENDING': 'PREPARING',
      'PREPARING': 'READY',
      'READY': 'COMPLETED'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || null;
  }

  getTimeAgo(date: Date): string {
    const minutes = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}