import { Pipe, PipeTransform } from '@angular/core';
import { OrderStatus } from '../models/order.types';

@Pipe({
  name: 'orderStatus',
  standalone: true,
})
export class OrderStatusPipe implements PipeTransform {
  private readonly statusMap = {
    [OrderStatus.DRAFT]: 'Draft',
    [OrderStatus.PENDING_PAYMENT]: 'Pending Payment',
    [OrderStatus.PAYMENT_PROCESSING]: 'Processing Payment',
    [OrderStatus.CONFIRMED]: 'Confirmed',
    [OrderStatus.PREPARING]: 'Preparing',
    [OrderStatus.READY]: 'Ready for Pickup',
    [OrderStatus.DELIVERED]: 'Delivered',
    [OrderStatus.CANCELLED]: 'Cancelled',
    [OrderStatus.FAILED]: 'Failed'
  };

  transform(status: OrderStatus): string {
    return this.statusMap[status] || 'Unknown';
  }
}

@Pipe({
  name: 'orderStatusColor',
  standalone: true,
})
export class OrderStatusColorPipe implements PipeTransform {
  private readonly colorMap = {
    [OrderStatus.DRAFT]: '#718096',
    [OrderStatus.PENDING_PAYMENT]: '#ed8936',
    [OrderStatus.PAYMENT_PROCESSING]: '#4299e1',
    [OrderStatus.CONFIRMED]: '#48bb78',
    [OrderStatus.PREPARING]: '#4299e1',
    [OrderStatus.READY]: '#ed8936',
    [OrderStatus.DELIVERED]: '#48bb78',
    [OrderStatus.CANCELLED]: '#e53e3e',
    [OrderStatus.FAILED]: '#e53e3e'
  };

  transform(status: OrderStatus): string {
    return this.colorMap[status] || '#718096';
  }
}

@Pipe({
  name: 'orderProgress',
  standalone: true,
})
export class OrderProgressPipe implements PipeTransform {
  private readonly progressMap = {
    [OrderStatus.DRAFT]: 0,
    [OrderStatus.PENDING_PAYMENT]: 20,
    [OrderStatus.PAYMENT_PROCESSING]: 40,
    [OrderStatus.CONFIRMED]: 60,
    [OrderStatus.PREPARING]: 80,
    [OrderStatus.READY]: 90,
    [OrderStatus.DELIVERED]: 100,
    [OrderStatus.CANCELLED]: 0,
    [OrderStatus.FAILED]: 0
  };

  transform(status: OrderStatus): number {
    return this.progressMap[status] || 0;
  }
}

@Pipe({
  name: 'estimatedTime',
  standalone: true,
})
export class EstimatedTimePipe implements PipeTransform {
  transform(minutes: number): string {
    if (minutes <= 0) return 'Ready';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours}h ${remainingMinutes}m`;
  }
}

@Pipe({
  name: 'paymentType',
  standalone: true,
})
export class PaymentTypePipe implements PipeTransform {
  private readonly typeMap = {
    'CREDIT_CARD': 'Credit Card',
    'DEBIT_CARD': 'Debit Card',
    'CASH': 'Cash',
    'DIGITAL_WALLET': 'Digital Wallet'
  };

  transform(type: string): string {
    return this.typeMap[type as keyof typeof this.typeMap] || type;
  }
}