import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
// import { EmptyStateComponent } from '../../../../../../../libs/shared/ui/src/lib/empty-state/empty-state.component';

// Services
import { CartService } from '../../services/cart.service';
import { ConfirmationService, MessageService } from 'primeng/api';

// Components
import { CartItemComponent } from '../cart-item/cart-item.component';
import { OrderSummaryComponent } from '../order-summary/order-summary.component';

// Models
import { CartItem, UpdateCartItemRequest } from '../../models/cart.models';

@Component({
  selector: 'tabletap-cart-display',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    CardModule,
    DividerModule,
    ScrollPanelModule,
    ToastModule,
    ConfirmDialogModule,
    BadgeModule,
    SkeletonModule,
    // EmptyStateComponent
    CartItemComponent,
    OrderSummaryComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './cart-display.component.html'
})
export class CartDisplayComponent {
  private readonly cartService = inject(CartService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  // Cart state signals
  readonly cart = this.cartService.cart;
  readonly items = this.cartService.items;
  readonly itemCount = this.cartService.itemCount;
  readonly isEmpty = this.cartService.isEmpty;
  readonly isLoading = this.cartService.isLoading;
  readonly errors = this.cartService.errors;
  readonly isValidForCheckout = this.cartService.isValidForCheckout;
  readonly lastUpdated = computed(() => this.cartService.cartState().lastUpdated);

  // Local state
  private readonly processingItems = signal<Set<string>>(new Set());

  constructor() {
    // Subscribe to cart actions for user feedback
    this.cartService.cartActions$.subscribe(action => {
      switch (action.action) {
        case 'ADD_ITEM':
          this.messageService.add({
            severity: 'success',
            summary: 'Item Added',
            detail: 'Item has been added to your cart',
            life: 3000,
          });
          break;
        case 'REMOVE_ITEM':
          this.messageService.add({
            severity: 'info',
            summary: 'Item Removed',
            detail: 'Item has been removed from your cart',
            life: 3000,
          });
          break;
        case 'CLEAR_CART':
          this.messageService.add({
            severity: 'info',
            summary: 'Cart Cleared',
            detail: 'All items have been removed from your cart',
            life: 3000,
          });
          break;
      }
    });
  }

  onQuantityChange(event: { itemId: string; quantity: number }): void {
    if (this.isProcessingItem(event.itemId)) return;

    this.setItemProcessing(event.itemId, true);

    this.cartService.updateQuantity(event.itemId, event.quantity);

    // Reset processing state after a short delay
    setTimeout(() => {
      this.setItemProcessing(event.itemId, false);
    }, 500);
  }

  onCustomizationChange(event: { itemId: string; customizations: any[] }): void {
    if (this.isProcessingItem(event.itemId)) return;

    this.setItemProcessing(event.itemId, true);

    const updateRequest: UpdateCartItemRequest = {
      cartItemId: event.itemId,
      customizations: event.customizations
    };

    this.cartService.updateCartItem(updateRequest).finally(() => {
      this.setItemProcessing(event.itemId, false);
    });
  }

  onNotesChange(event: { itemId: string; notes: string }): void {
    if (this.isProcessingItem(event.itemId)) return;

    this.setItemProcessing(event.itemId, true);

    const updateRequest: UpdateCartItemRequest = {
      cartItemId: event.itemId,
      notes: event.notes
    };

    this.cartService.updateCartItem(updateRequest).finally(() => {
      this.setItemProcessing(event.itemId, false);
    });
  }

  confirmRemoveItem(itemId: string): void {
    const item = this.items().find(i => i.id === itemId);
    if (!item) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to remove "${item.name}" from your cart?`,
      header: 'Remove Item',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.cartService.removeCartItem(itemId);
      }
    });
  }

  confirmClearCart(): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to clear your entire cart? This action cannot be undone.`,
      header: 'Clear Cart',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.cartService.clearCart();
      }
    });
  }

  onCheckout(): void {
    if (!this.isValidForCheckout()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Checkout Unavailable',
        detail: 'Please resolve cart issues before proceeding to checkout',
        life: 5000,
      });
      return;
    }

    // Navigate to checkout or emit checkout event
    this.messageService.add({
      severity: 'info',
      summary: 'Checkout',
      detail: 'Proceeding to checkout...',
      life: 3000,
    });

    // TODO: Implement checkout navigation
    // this.router.navigate(['/checkout']);
  }

  onApplyDiscount(discountCode: string): void {
    // TODO: Implement discount application
    this.messageService.add({
      severity: 'info',
      summary: 'Discount Code',
      detail: `Applying discount code: ${discountCode}`,
      life: 3000
    });
  }

  navigateToMenu(): void {
    // TODO: Implement menu navigation
    // this.router.navigate(['/menu']);
  }

  trackByItemId(index: number, item: CartItem): string {
    return item.id;
  }

  formatError(error: any): string {
    return error.message || 'An unknown error occurred';
  }

  private isProcessingItem(itemId: string): boolean {
    return this.processingItems().has(itemId);
  }

  private setItemProcessing(itemId: string, processing: boolean): void {
    this.processingItems.update(items => {
      const newItems = new Set(items);
      if (processing) {
        newItems.add(itemId);
      } else {
        newItems.delete(itemId);
      }
      return newItems;
    });
  }
}