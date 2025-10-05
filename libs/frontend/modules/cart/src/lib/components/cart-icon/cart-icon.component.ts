import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ScrollPanelModule } from 'primeng/scrollpanel';

// Services
import { CartService } from '../../services/cart.service';

// Components


// Models
import { CartItem } from '../../models/cart.models';

@Component({
  selector: 'tabletap-cart-icon',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    BadgeModule,
    PopoverModule,
    TooltipModule,
    DividerModule,
    ScrollPanelModule,
    ],
  templateUrl: './cart-icon.component.html'
})
export class CartIconComponent {
  readonly size = input<'small' | 'large'>('small');
  readonly outlined = input(false);
  readonly text = input(false);
  readonly disabled = input(false);
  readonly showPreview = input(true);
  readonly maxPreviewItems = input(3);
  readonly buttonStyles = input<any>({});
  readonly additionalClasses = input('');

  readonly cartClick = output<void>();
  readonly viewCart = output<void>();
  readonly checkout = output<void>();

  private readonly cartService = inject(CartService);

  // Cart state from service
  readonly cart = this.cartService.cart;
  readonly items = this.cartService.items;
  readonly itemCount = this.cartService.itemCount;
  readonly isEmpty = this.cartService.isEmpty;
  readonly subtotal = this.cartService.subtotal;
  readonly total = this.cartService.total;
  readonly isValidForCheckout = this.cartService.isValidForCheckout;
  readonly errors = this.cartService.errors;

  // Computed properties for display
  readonly cartIcon = computed(() => {
    return this.itemCount() > 0 ? 'pi pi-shopping-cart' : 'pi pi-shopping-cart';
  });

  readonly buttonSeverity = computed(() => {
    if (this.itemCount() > 0) {
      return this.isValidForCheckout() ? 'success' : 'danger';
    }
    return 'secondary';
  });

  readonly tooltipText = computed(() => {
    if (this.isEmpty()) {
      return 'Your cart is empty';
    }

    const itemText = this.itemCount() === 1 ? 'item' : 'items';
    const total = this.total()
    return `${this.itemCount()} ${itemText} • ${total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
  });

  constructor() {
    // Subscribe to cart actions for visual feedback
    this.cartService.cartActions$.subscribe(action => {
      if (action.action === 'ADD_ITEM') {
        this.triggerAddItemAnimation()
      }
    });
  }

  onCartClick(event: Event): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.cartClick.emit()

    if (this.showPreview()) {
      // The overlay panel will handle showing/hiding
    } else {
      this.navigateToCart()
    }
  }

  navigateToCart(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.viewCart.emit()
    // TODO: Implement navigation to cart page
    // this.router.navigate(['/cart']);
  }

  navigateToCheckout(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.checkout.emit()
    // TODO: Implement navigation to checkout page
    // this.router.navigate(['/checkout']);
  }

  navigateToMenu(): void {
    // TODO: Implement navigation to menu page
    // this.router.navigate(['/menu']);
  }

  hideOverlay(): void {
    // The overlay panel will handle this automatically when clicking buttons
  }

  trackByItemId(index: number, item: CartItem): string {
    return item.id;
  }

  hasCustomizations(item: CartItem): boolean {
    return item.customizations && item.customizations.length > 0;
  }

  getCustomizationsSummary(item: CartItem): string {
    if (!this.hasCustomizations(item)) {
      return '';
    }

    const selectedOptions: string[] = []

    item.customizations.forEach(customization => {
      const selected = customization.options?.filter(opt => opt.selected) || []
      selected.forEach(option => {
        selectedOptions.push(option.name);
      });
    });

    if (selectedOptions.length === 0) {
      return 'No customizations';
    }

    if (selectedOptions.length <= 2) {
      return selectedOptions.join(', ');
    }

    return `${selectedOptions.slice(0, 2).join(', ')} +${selectedOptions.length - 2} more`;
  }

  formatError(error: any): string {
    return error.message || 'Unknown error';
  }

  private triggerAddItemAnimation(): void {
    // Add shake animation to indicate item was added
    const button = document.querySelector('.cart-icon-button');
    if (button) {
      button.classList.add('shake');
      setTimeout(() => {
        button.classList.remove('shake');
      }, 500);
    }
  }

  // Method to programmatically show the cart preview
  showCartPreview(): void {
    if (this.showPreview()) {
      const overlayPanel = document.querySelector('p-overlaypanel');
      if (overlayPanel) {
        // Trigger overlay panel show
        const button = document.querySelector('.cart-icon-button');
        if (button) {
          button.dispatchEvent(new Event('click'));
        }
      }
    }
  }

  // Method to get cart summary for external use
  getCartSummary(): { itemCount: number; total: number; isValid: boolean } {
    return {
      itemCount: this.itemCount(),
      total: this.total(),
      isValid: this.isValidForCheckout()
    };
  }
}