import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Components
import { OrderCheckoutComponent } from './components/order-checkout/order-checkout.component';
import { OrderConfirmationComponent } from './components/order-confirmation/order-confirmation.component';
import { OrderTrackingComponent } from './components/order-tracking/order-tracking.component';
import { PaymentMethodSelectorComponent } from './components/payment-method-selector/payment-method-selector.component';

// Services
import { OrderService } from './services/order.service';

// Guards
import { OrderGuard, OrderCompletionGuard } from './guards/order-guard';

// Pipes
import {
  OrderStatusPipe,
  OrderStatusColorPipe,
  OrderProgressPipe,
  EstimatedTimePipe,
  PaymentTypePipe,
} from './pipes/order-status.pipe';

// Routes
import { orderRoutes } from './order.routes';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(orderRoutes)
  ],
  providers: [
    OrderService
  ],
})
export class OrderModule { }