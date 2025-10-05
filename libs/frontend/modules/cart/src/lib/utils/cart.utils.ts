import { CartItem, CartItemCustomization, CustomizationOption, Cart } from '../models/cart.models';

/**
 * Utility functions for cart operations
 */
export class CartUtils {

  /**
   * Calculate the total price for a cart item including customizations
   */
  static calculateItemTotal(item: CartItem): number {
    let total = item.basePrice * item.quantity;

    // Add customization costs
    if (item.customizations) {
      item.customizations.forEach(customization => {
        if (customization.options) {
          customization.options.forEach(option => {
            if (option.selected) {
              total += option.priceModifier * item.quantity;
            }
          });
        }
      });
    }

    return Math.round(total * 100) / 100;
  }

  /**
   * Calculate cart totals including tax and fees
   */
  static calculateCartTotals(cart: Cart, config: { taxRate: number; serviceFeeRate: number; deliveryFee: number }): {
    subtotal: number;
    tax: number;
    serviceFee: number;
    deliveryFee: number;
    total: number;
  } {
    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = Math.round(subtotal * config.taxRate * 100) / 100;
    const serviceFee = Math.round(subtotal * config.serviceFeeRate * 100) / 100;
    const total = Math.round((subtotal + tax + serviceFee + config.deliveryFee - cart.discount) * 100) / 100;

    return {
      subtotal,
      tax,
      serviceFee: serviceFee,
      deliveryFee: config.deliveryFee,
      total
    };
  }

  /**
   * Format currency values consistently
   */
  static formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Check if two cart items are identical (same menu item and customizations)
   */
  static areItemsIdentical(item1: CartItem, item2: CartItem): boolean {
    if (item1.menuItemId !== item2.menuItemId) {
      return false;
    }

    return this.areCustomizationsEqual(item1.customizations, item2.customizations);
  }

  /**
   * Compare two sets of customizations for equality
   */
  static areCustomizationsEqual(
    customizations1: CartItemCustomization[] = [],
    customizations2: CartItemCustomization[] = []
  ): boolean {
    if (customizations1.length !== customizations2.length) {
      return false;
    }

    // Sort by ID for consistent comparison
    const sorted1 = [...customizations1].sort((a, b) => a.id.localeCompare(b.id));
    const sorted2 = [...customizations2].sort((a, b) => a.id.localeCompare(b.id));

    return sorted1.every((customization1, index) => {
      const customization2 = sorted2[index]

      if (customization1.id !== customization2.id) {
        return false;
      }

      return this.areOptionsEqual(customization1.options || [], customization2.options || []);
    });
  }

  /**
   * Compare two sets of customization options for equality
   */
  static areOptionsEqual(options1: CustomizationOption[], options2: CustomizationOption[]): boolean {
    if (options1.length !== options2.length) {
      return false;
    }

    // Sort by ID for consistent comparison
    const sorted1 = [...options1].sort((a, b) => a.id.localeCompare(b.id));
    const sorted2 = [...options2].sort((a, b) => a.id.localeCompare(b.id));

    return sorted1.every((option1, index) => {
      const option2 = sorted2[index]
      return option1.id === option2.id && option1.selected === option2.selected;
    });
  }

  /**
   * Get a summary of selected customizations for display
   */
  static getCustomizationsSummary(customizations: CartItemCustomization[] = []): string {
    const selectedOptions: string[] = []

    customizations.forEach(customization => {
      const selected = customization.options?.filter(opt => opt.selected) || []
      selected.forEach(option => {
        selectedOptions.push(option.name);
      });
    });

    if (selectedOptions.length === 0) {
      return 'No customizations';
    }

    if (selectedOptions.length <= 3) {
      return selectedOptions.join(', ');
    }

    return `${selectedOptions.slice(0, 3).join(', ')} +${selectedOptions.length - 3} more`;
  }

  /**
   * Calculate the additional cost from customizations
   */
  static getCustomizationsCost(customizations: CartItemCustomization[] = [], quantity = 1): number {
    let cost = 0;

    customizations.forEach(customization => {
      if (customization.options) {
        customization.options.forEach(option => {
          if (option.selected) {
            cost += option.priceModifier * quantity;
          }
        });
      }
    });

    return Math.round(cost * 100) / 100;
  }

  /**
   * Validate cart item structure
   */
  static validateCartItem(item: CartItem): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!item.id) {
      errors.push('Item ID is required');
    }

    if (!item.menuItemId) {
      errors.push('Menu item ID is required');
    }

    if (!item.name || item.name.trim() === '') {
      errors.push('Item name is required');
    }

    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      errors.push('Quantity must be a positive number');
    }

    if (typeof item.basePrice !== 'number' || item.basePrice < 0) {
      errors.push('Base price must be a non-negative number');
    }

    if (typeof item.totalPrice !== 'number' || item.totalPrice < 0) {
      errors.push('Total price must be a non-negative number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a cart item ID
   */
  static generateCartItemId(): string {
    return `cart_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a cart ID
   */
  static generateCartId(): string {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get cart expiration date
   */
  static getCartExpirationDate(hours = 24): Date {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  /**
   * Check if cart is expired
   */
  static isCartExpired(cart: Cart): boolean {
    if (!cart.expiresAt) {
      return false;
    }
    return new Date(cart.expiresAt) < new Date();
  }

  /**
   * Estimate delivery time based on cart contents and distance
   */
  static estimateDeliveryTime(items: CartItem[], distanceKm = 5): {
    min: number;
    max: number;
    text: string;
  } {
    const baseTime = 20; // Base preparation time in minutes
    const itemPreparationTime = items.reduce((time, item) => {
      const complexity = this.getItemComplexity(item);
      return time + (complexity * item.quantity * 2); // 2 minutes per complexity point
    }, 0);

    const deliveryTime = distanceKm * 2; // 2 minutes per km

    const totalMin = baseTime + itemPreparationTime + deliveryTime;
    const totalMax = totalMin + 15; // Add 15 minute buffer

    return {
      min: Math.round(totalMin),
      max: Math.round(totalMax),
      text: `${Math.round(totalMin)}-${Math.round(totalMax)} minutes`
    };
  }

  /**
   * Get item complexity score based on customizations
   */
  static getItemComplexity(item: CartItem): number {
    let complexity = 1; // Base complexity

    if (item.customizations) {
      complexity += item.customizations.length * 0.5;

      item.customizations.forEach(customization => {
        const selectedCount = customization.options?.filter(opt => opt.selected).length || 0;
        complexity += selectedCount * 0.2;
      });
    }

    return Math.min(complexity, 5); // Cap at 5
  }

  /**
   * Group cart items by category for better organization
   */
  static groupItemsByCategory(items: CartItem[]): { [category: string]: CartItem[] } {
    return items.reduce((groups, item) => {
      const category = item.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {} as { [category: string]: CartItem[] });
  }

  /**
   * Calculate discount amount based on type and value
   */
  static calculateDiscount(
    subtotal: number,
    discountType: 'percentage' | 'fixed',
    discountValue: number
  ): number {
    if (discountType === 'percentage') {
      return Math.round(subtotal * (discountValue / 100) * 100) / 100;
    } else {
      return Math.min(discountValue, subtotal);
    }
  }

  /**
   * Format item count text for display
   */
  static formatItemCount(count: number): string {
    return count === 1 ? '1 item' : `${count} items`;
  }

  /**
   * Create a cart summary for analytics or logging
   */
  static createCartSummary(cart: Cart): {
    itemCount: number,
    uniqueItems: number,
    totalQuantity: number,
    averageItemPrice: number,
    categories: string[],
    hasCustomizations: boolean
  } {
    const itemCount = cart.items.length;
    const uniqueItems = new Set(cart.items.map(item => item.menuItemId)).size;
    const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const averageItemPrice = itemCount > 0 ? cart.subtotal / totalQuantity : 0;
    const categories = [...new Set(cart.items.map(item => item.category))];
    const hasCustomizations = cart.items.some(item =>
      item.customizations && item.customizations.length > 0
    );

    return {
      itemCount,
      uniqueItems,
      totalQuantity,
      averageItemPrice: Math.round(averageItemPrice * 100) / 100,
      categories,
      hasCustomizations
    };
  }
}