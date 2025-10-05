import { Component, computed, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';

// Models
import { Cart, CartValidationError, CartFee } from '../../models/cart.models';

@Component({
  selector: 'tabletap-order-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DividerModule,
    InputTextModule,
    MessageModule,
    MessageModule,
    TooltipModule,
    TagModule,
    ProgressBarModule,
  ],
  templateUrl: './order-summary.component.html',
})
export class OrderSummaryComponent {
  readonly cart = input<Cart | null>(null);
  readonly isCheckoutEnabled = input(false);
  readonly errors = input<CartValidationError[]>([]);

  readonly checkout = output<void>();
  readonly applyDiscount = output<string>();

  // Local state
  private readonly _showDiscountInput = signal(false);
  private readonly _applyingDiscount = signal(false);
  private readonly _processingCheckout = signal(false);

  // Form values
  discountCode = '';

  // Configuration
  readonly minimumOrderAmount = 10.00;
  readonly estimatedDeliveryTime = '25-35 minutes';

  // Computed values
  readonly itemCountText = computed(() => {
    const count = this.cart()?.items?.length || 0;
    return count === 1 ? '1 item' : `${count} items`;
  });

  readonly minimumOrderProgress = computed(() => {
    const subtotal = this.cart()?.subtotal || 0;
    return Math.min((subtotal / this.minimumOrderAmount) * 100, 100);
  });

  readonly showMinimumOrderProgress = computed(() => {
    const subtotal = this.cart()?.subtotal || 0;
    return subtotal < this.minimumOrderAmount;
  });

  readonly hasDiscount = computed(() => {
    return (this.cart()?.discount || 0) > 0;
  });

  // Signals for template access
  readonly showDiscountInput = this._showDiscountInput.asReadonly()
  readonly applyingDiscount = this._applyingDiscount.asReadonly()
  readonly processingCheckout = this._processingCheckout.asReadonly()

  toggleDiscountInput(): void {
    this._showDiscountInput.update(show => !show);
    if (this._showDiscountInput()) {
      this.discountCode = '';
    }
  }

  hideDiscountInput(): void {
    this._showDiscountInput.set(false);
    this.discountCode = '';
  }

  async applyDiscountCode(): Promise<void> {
    const code = this.discountCode.trim()
    if (!code) return;

    this._applyingDiscount.set(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.applyDiscount.emit(code);
      this.hideDiscountInput()
    } catch (error) {
      console.error('Failed to apply discount:', error);
    } finally {
      this._applyingDiscount.set(false);
    }
  }

  removeDiscount(): void {
    // Emit discount removal event
    this.applyDiscount.emit('');
  }

  async onCheckout(): Promise<void> {
    if (!this.isCheckoutEnabled() || !this.cart()) return;

    this._processingCheckout.set(true);

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // TODO: The 'emit' function requires a mandatory void argument
      this.checkout.emit()
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      this._processingCheckout.set(false);
    }
  }

  formatError(error: CartValidationError): string {
    // Format error messages for better display
    switch (error.code) {
      case 'MINIMUM_ORDER_NOT_MET':
        return `Add ${(this.minimumOrderAmount - (this.cart()?.subtotal || 0)).toFixed(2)} more to meet minimum order`;
      case 'EMPTY_CART':
        return 'Your cart is empty';
      case 'CART_EXPIRED':
        return 'Your cart has expired, please refresh';
      default:
        return error.message;
    }
  }

  // Helper methods for fee display
  getFeeTooltip(fee: CartFee): string {
    if (fee.type === 'percentage') {
      return `${fee.description || fee.name} (${(parseFloat(fee.amount.toString()) / (this.cart()?.subtotal || 1) * 100).toFixed(1)}%)`;
    }
    return fee.description || fee.name;
  }

  getTotalSavings(): number {
    return (this.cart()?.discount || 0);
  }

  // Accessibility helpers
  getCheckoutButtonAriaLabel(): string {
    if (!this.isCheckoutEnabled()) {
      return 'Checkout disabled. Please resolve cart issues first.';
    }
    return `Proceed to checkout. Total: ${this.cart()?.total || 0}`;
  }

  getDiscountButtonAriaLabel(): string {
    return this.showDiscountInput()
      ? 'Hide discount code input'
      : 'Show discount code input';
  }
}