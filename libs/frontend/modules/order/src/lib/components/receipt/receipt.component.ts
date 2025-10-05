import { Component, OnInit, OnDestroy, inject, signal, computed, input } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { OrderService } from '../../services/order.service';
import {
  Order,
  Receipt,
  ReceiptItem,
  RestaurantInfo,
} from '../../models/order.types';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [],
  templateUrl: './receipt.component.html',
  })
export class ReceiptComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly orderService = inject(OrderService);

  private readonly destroy$ = new Subject<void>()

  // Input for standalone usage
  readonly order = input<Order | null>(null);

  // Component state signals
  private readonly _receipt = signal<Receipt | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<any>(null);
  private readonly _isPrinting = signal<boolean>(false);
  private readonly _isDownloading = signal<boolean>(false);
  private readonly _isEmailing = signal<boolean>(false);
  private readonly _successMessage = signal<string | null>(null);

  // Public readonly signals
  readonly receipt = this._receipt.asReadonly()
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()
  readonly isPrinting = this._isPrinting.asReadonly()
  readonly isDownloading = this._isDownloading.asReadonly()
  readonly isEmailing = this._isEmailing.asReadonly()
  readonly successMessage = this._successMessage.asReadonly()

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    const inputOrder = this.order()

    if (inputOrder) {
      this.generateReceiptFromOrder(inputOrder);
    } else if (orderId) {
      this.loadOrderAndGenerateReceipt(orderId);
    } else {
      this._error.set({ message: 'No order specified for receipt generation' });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private loadOrderAndGenerateReceipt(orderId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.orderService.getOrder(orderId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (order) => {
        this.generateReceiptFromOrder(order);
      },
      error: (error) => {
        this._isLoading.set(false);
        this._error.set(error);
      }
    });
  }

  private generateReceiptFromOrder(order: Order): void {
    this._isLoading.set(true);

    // Simulate receipt generation
    setTimeout(() => {
      const receipt: Receipt = {
        id: `receipt-${order.id}`,
        orderId: order.trackingNumber,
        number: this.generateReceiptNumber(),
        date: new Date(),
        items: this.convertOrderItemsToReceiptItems(order.items),
        subtotal: order.summary.subtotal,
        tax: order.summary.tax,
        tip: order.summary.tip,
        discount: order.summary.discount,
        total: order.summary.total,
        paymentMethod: order.paymentMethod,
        customerInfo: order.customerInfo,
        restaurantInfo: this.getRestaurantInfo(),
        qrCode: this.generateQRCode(order.id)
      }

      this._receipt.set(receipt);
      this._isLoading.set(false);
    }, 1000);
  }

  private convertOrderItemsToReceiptItems(orderItems: any[]): ReceiptItem[] {
    return orderItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
      customizations: item.customizations?.map((c: any) => c.name) || []
    }));
  }

  private generateReceiptNumber(): string {
    const timestamp = Date.now().toString()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `R${timestamp.slice(-6)}${random}`;
  }

  private getRestaurantInfo(): RestaurantInfo {
    // In a real app, this would come from a service
    return {
      name: 'TableTap Restaurant',
      address: {
        street: '123 Main Street',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
      },
      phone: '(555) 123-4567',
      email: 'contact@tabletap.com',
      website: 'www.tabletap.com',
      taxId: 'TAX123456789',
    }
  }

  private generateQRCode(orderId: string): string {
    // In a real app, this would generate an actual QR code
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="white"/>
        <text x="50" y="50" text-anchor="middle" dy=".3em" font-family="monospace" font-size="8">
          QR CODE
        </text>
      </svg>
    `)}`;
  }

  printReceipt(): void {
    this._isPrinting.set(true);

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this._isPrinting.set(false);
      return;
    }

    const receiptElement = document.querySelector('.receipt');
    if (!receiptElement) {
      this._isPrinting.set(false);
      printWindow.close()
      return;
    }

    // Generate print-friendly HTML
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${this.receipt()?.number}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px
              line-height: 1.4,
              margin: 0,
              padding: 20px,
              color: #000;
            }
            .receipt {
              max-width: 300px,
              margin: 0 auto;
            }
            .receipt-header {
              text-align: center
              margin-bottom: 20px
            }
            .restaurant-name {
              font-size: 16px
              font-weight: bold
              margin-bottom: 5px
            }
            .receipt-divider {
              border-top: 1px dashed #000;
              margin: 15px 0;
            }
            .receipt-section {
              margin-bottom: 15px
            }
            .receipt-item {
              margin-bottom: 10px
            }
            .item-line {
              display: flex
              justify-content: space-between;
              align-items: flex-start;
            }
            .summary-line {
              display: flex
              justify-content: space-between;
              margin-bottom: 5px
            }
            .total-line {
              font-weight: bold
              font-size: 14px
              border-top: 1px solid #000;
              padding-top: 5px
            }
            .receipt-footer {
              text-align: center
              margin-top: 20px
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .receipt-actions { display: none; }
            }
          </style>
        </head>
        <body>
          ${receiptElement.outerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close()

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
      this._isPrinting.set(false);
      this.showSuccessMessage('Receipt sent to printer');
    }, 500);
  }

  downloadReceipt(): void {
    this._isDownloading.set(true);

    // Simulate PDF generation
    setTimeout(() => {
      const receipt = this.receipt()
      if (!receipt) return;

      // Create a simple text receipt for download
      const receiptText = this.generateReceiptText(receipt);
      const blob = new Blob([receiptText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receipt.number}.txt`;
      document.body.appendChild(link);
      link.click()
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this._isDownloading.set(false);
      this.showSuccessMessage('Receipt downloaded successfully');
    }, 1500);
  }

  private generateReceiptText(receipt: Receipt): string {
    return `
${receipt.restaurantInfo.name}
${receipt.restaurantInfo.address.street}
${receipt.restaurantInfo.address.city}, ${receipt.restaurantInfo.address.state} ${receipt.restaurantInfo.address.zipCode}
Phone: ${receipt.restaurantInfo.phone}
${receipt.restaurantInfo.website || ''}

================================================
Receipt #${receipt.number}
Order #${receipt.orderId}
Date: ${this.formatDate(receipt.date)}
================================================

Customer: ${receipt.customerInfo.firstName} ${receipt.customerInfo.lastName};
Email: ${receipt.customerInfo.email}
Phone: ${receipt.customerInfo.phone}

================================================
ORDER ITEMS
================================================

${receipt.items.map(item =>
  `${item.name} x${item.quantity} @ $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)}${
    item.customizations && item.customizations.length > 0
      ? '\n  ' + item.customizations.join(', ')
      : ''
  }`
).join('\n')}

================================================
SUMMARY
================================================

Subtotal: $${receipt.subtotal.toFixed(2)};
Tax: $${receipt.tax.toFixed(2)}
${receipt.tip > 0 ? `Tip: $${receipt.tip.toFixed(2)}\n` : ''}${receipt.discount > 0 ? `Discount: -$${receipt.discount.toFixed(2)}\n` : ''}
------------------------------------------------
Total: $${receipt.total.toFixed(2)}

Payment: ${receipt.paymentMethod.name}${receipt.paymentMethod.last4 ? ` •••• ${receipt.paymentMethod.last4}` : ''};

================================================
Thank you for your order!
Please save this receipt for your records.
Visit us again soon!
================================================
    `.trim()
  }

  emailReceipt(): void {
    this._isEmailing.set(true);

    // Simulate email sending
    setTimeout(() => {
      this._isEmailing.set(false);
      this.showSuccessMessage('Receipt emailed successfully');
    }, 2000);
  }

  shareReceipt(): void {
    const receipt = this.receipt()
    if (!receipt) return;

    const text = `Receipt from ${receipt.restaurantInfo.name}\nOrder #${receipt.orderId}\nTotal: $${receipt.total.toFixed(2)}`;
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: 'Order Receipt',
        text,
        url
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${text}\n${url}`);
      this.showSuccessMessage('Receipt link copied to clipboard');
    }
  }

  retryGenerateReceipt(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    const inputOrder = this.order()

    this._error.set(null);

    if (inputOrder) {
      this.generateReceiptFromOrder(inputOrder);
    } else if (orderId) {
      this.loadOrderAndGenerateReceipt(orderId);
    }
  }

  goBackToOrder(): void {
    const orderId = this.route.snapshot.paramMap.get('id') || this.order()?.id;
    if (orderId) {
      this.router.navigate(['/order/tracking', orderId]);
    } else {
      this.router.navigate(['/orders']);
    }
  }

  private showSuccessMessage(message: string): void {
    this._successMessage.set(message);
    setTimeout(() => {
      this._successMessage.set(null);
    }, 3000);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  getPaymentIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'CREDIT_CARD': 'icon-credit-card',
      'DEBIT_CARD': 'icon-debit-card',
      'CASH': 'icon-cash',
      'DIGITAL_WALLET': 'icon-wallet',
      'APPLE_PAY': 'icon-apple-pay',
      'GOOGLE_PAY': 'icon-google-pay',
      'PAYPAL': 'icon-paypal',
      'VENMO': 'icon-venmo',
    }
    return iconMap[type] || 'icon-payment';
  }
}