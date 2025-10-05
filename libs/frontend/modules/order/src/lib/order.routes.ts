import { Routes } from '@angular/router';
import {
  OrderGuard,
  OrderCompletionGuard,
  OrderTrackingGuard,
  PaymentCompletionGuard,
  CartNotEmptyGuard,
  OrderLimitsGuard,
} from './guards/order-guard';

export const orderRoutes: Routes = [
  {
    path: '',
    redirectTo: 'checkout',
    pathMatch: 'full',
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./components/order-checkout/order-checkout.component').then(
        c => c.OrderCheckoutComponent
      ),
    canActivate: [CartNotEmptyGuard, OrderLimitsGuard, OrderCompletionGuard],
    title: 'Checkout - TableTap',
  },
  {
    path: 'confirmation',
    loadComponent: () =>
      import('./components/order-confirmation/order-confirmation.component').then(
        c => c.OrderConfirmationComponent
      ),
    canActivate: [OrderGuard, OrderCompletionGuard],
    title: 'Order Confirmation - TableTap',
  },
  {
    path: 'tracking/:id',
    loadComponent: () =>
      import('./components/order-tracking/order-tracking.component').then(
        c => c.OrderTrackingComponent
      ),
    canActivate: [OrderTrackingGuard, PaymentCompletionGuard],
    title: 'Track Order - TableTap',
  },
  {
    path: 'receipt/:id',
    loadComponent: () =>
      import('./components/receipt/receipt.component').then(
        c => c.ReceiptComponent
      ),
    canActivate: [OrderTrackingGuard],
    title: 'Order Receipt - TableTap',
  },
  {
    path: '**',
    redirectTo: 'checkout',
  }
  ];