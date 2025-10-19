import { Injectable } from '@angular/core';
import {
  Cart,
  CartItem,
  AddToCartRequest,
  UpdateCartItemRequest,
  CartValidationError,
  CartConfig
} from '../models/cart.models';

@Injectable({
  providedIn: 'root',
})
export class CartValidationService {
  private readonly config: CartConfig = {
    maxItems: 50,
    maxQuantityPerItem: 10,
    taxRate: 0.08,
    serviceFeeRate: 0.03,
    deliveryFee: 2.99,
    minimumOrderAmount: 10.00,
    cartExpirationHours: 24,
  }

  async validateAddToCart(request: AddToCartRequest, cart: Cart | null): Promise<CartValidationError[]> {
    const errors: CartValidationError[] = []

    // Validate request structure
    errors.push(...this.validateAddToCartRequest(request));

    if (cart) {
      // Validate cart limits
      errors.push(...this.validateCartLimits(cart, request.quantity));

      // Validate menu item availability
      errors.push(...await this.validateMenuItemAvailability(request.menuItemId));

      // Validate customizations
      errors.push(...await this.validateCustomizations(request.customizations || []));
    }

    return errors;
  }

  async validateUpdateCartItem(request: UpdateCartItemRequest, cart: Cart): Promise<CartValidationError[]> {
    const errors: CartValidationError[] = []

    // Validate request structure
    errors.push(...this.validateUpdateCartItemRequest(request));

    // Check if item exists in cart
    const itemExists = cart.items.some(item => item.id === request.cartItemId);
    if (!itemExists) {
      errors.push({
        field: 'cartItemId',
        message: 'Item not found in cart',
        code: 'ITEM_NOT_FOUND',
      });
      return errors;
    }

    // Validate quantity if provided
    if (request.quantity !== undefined) {
      errors.push(...this.validateQuantity(request.quantity));
    }

    // Validate customizations if provided
    if (request.customizations) {
      errors.push(...await this.validateCustomizations(request.customizations));
    }

    return errors;
  }

  validateCartForCheckout(cart: Cart | null): CartValidationError[] {
    const errors: CartValidationError[] = []

    if (!cart) {
      errors.push({
        field: 'cart',
        message: 'Cart is not initialized',
        code: 'CART_NOT_INITIALIZED',
      });
      return errors;
    }

    // Check if cart is empty
    if (cart.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'Cart is empty',
        code: 'EMPTY_CART',
      });
    }

    // Check minimum order amount
    if (cart.subtotal < this.config.minimumOrderAmount) {
      errors.push({
        field: 'subtotal',
        message: `Minimum order amount is $${this.config.minimumOrderAmount.toFixed(2)}`,
        code: 'MINIMUM_ORDER_NOT_MET',
      });
    }

    // Check cart expiration
    if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
      errors.push({
        field: 'expiresAt',
        message: 'Cart has expired',
        code: 'CART_EXPIRED',
      });
    }

    // Validate each item in cart
    cart.items.forEach((item, index) => {
      const itemErrors = this.validateCartItem(item);
      itemErrors.forEach(error => {
        errors.push({
          ...error,
          field: `items[${index}].${error.field}`,
        });
      });
    });

    return errors;
  }

  validateCartItem(item: CartItem): CartValidationError[] {
    const errors: CartValidationError[] = []

    // Validate required fields
    if (!item.id) {
      errors.push({
        field: 'id',
        message: 'Item ID is required',
        code: 'MISSING_ITEM_ID',
      });
    }

    if (!item.menuItemId) {
      errors.push({
        field: 'menuItemId',
        message: 'Menu item ID is required',
        code: 'MISSING_MENU_ITEM_ID',
      });
    }

    if (!item.name || item.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Item name is required',
        code: 'MISSING_ITEM_NAME',
      });
    }

    // Validate quantity
    errors.push(...this.validateQuantity(item.quantity, 'quantity'));

    // Validate price
    if (typeof item.basePrice !== 'number' || item.basePrice < 0) {
      errors.push({
        field: 'basePrice',
        message: 'Base price must be a non-negative number',
        code: 'INVALID_BASE_PRICE',
      });
    }

    if (typeof item.totalPrice !== 'number' || item.totalPrice < 0) {
      errors.push({
        field: 'totalPrice',
        message: 'Total price must be a non-negative number',
        code: 'INVALID_TOTAL_PRICE',
      });
    }

    // Validate customizations
    if (item.customizations) {
      item.customizations.forEach((customization, index) => {
        const customizationErrors = this.validateItemCustomization(customization);
        customizationErrors.forEach(error => {
          errors.push({
            ...error,
            field: `customizations[${index}].${error.field}`,
          });
        });
      });
    }

    // Validate notes length
    if (item.notes && item.notes.length > 500) {
      errors.push({
        field: 'notes',
        message: 'Notes must be 500 characters or less',
        code: 'NOTES_TOO_LONG',
      });
    }

    return errors;
  }

  private validateAddToCartRequest(request: AddToCartRequest): CartValidationError[] {
    const errors: CartValidationError[] = []

    if (!request.menuItemId || request.menuItemId.trim() === '') {
      errors.push({
        field: 'menuItemId',
        message: 'Menu item ID is required',
        code: 'MISSING_MENU_ITEM_ID',
      });
    }

    errors.push(...this.validateQuantity(request.quantity));

    if (request.notes && request.notes.length > 500) {
      errors.push({
        field: 'notes',
        message: 'Notes must be 500 characters or less',
        code: 'NOTES_TOO_LONG',
      });
    }

    return errors;
  }

  private validateUpdateCartItemRequest(request: UpdateCartItemRequest): CartValidationError[] {
    const errors: CartValidationError[] = []

    if (!request.cartItemId || request.cartItemId.trim() === '') {
      errors.push({
        field: 'cartItemId',
        message: 'Cart item ID is required',
        code: 'MISSING_CART_ITEM_ID',
      });
    }

    if (request.notes && request.notes.length > 500) {
      errors.push({
        field: 'notes',
        message: 'Notes must be 500 characters or less',
        code: 'NOTES_TOO_LONG',
      });
    }

    return errors;
  }

  private validateQuantity(quantity: number, field = 'quantity'): CartValidationError[] {
    const errors: CartValidationError[] = []

    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      errors.push({
        field,
        message: 'Quantity must be a positive integer',
        code: 'INVALID_QUANTITY_TYPE',
      });
    } else {
      if (quantity < 1) {
        errors.push({
          field,
          message: 'Quantity must be at least 1',
          code: 'QUANTITY_TOO_LOW',
        });
      }

      if (quantity > this.config.maxQuantityPerItem) {
        errors.push({
          field,
          message: `Quantity cannot exceed ${this.config.maxQuantityPerItem}`,
          code: 'QUANTITY_TOO_HIGH',
        });
      }
    }

    return errors;
  }

  private validateCartLimits(cart: Cart, additionalQuantity: number): CartValidationError[] {
    const errors: CartValidationError[] = []

    // Check maximum items limit
    if (cart.items.length >= this.config.maxItems) {
      errors.push({
        field: 'items',
        message: `Cannot add more items. Maximum ${this.config.maxItems} items allowed`,
        code: 'MAX_ITEMS_EXCEEDED',
      });
    }

    // Check total quantity limit (if applicable)
    const currentTotalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const maxTotalQuantity = this.config.maxItems * this.config.maxQuantityPerItem;

    if (currentTotalQuantity + additionalQuantity > maxTotalQuantity) {
      errors.push({
        field: 'quantity',
        message: 'Adding this quantity would exceed cart limits',
        code: 'TOTAL_QUANTITY_EXCEEDED',
      });
    }

    return errors;
  }

  private async validateMenuItemAvailability(menuItemId: string): Promise<CartValidationError[]> {
    const errors: CartValidationError[] = []

    // This would typically call a menu service to check availability
    // For now, we'll implement basic validation
    if (!menuItemId || menuItemId.trim() === '') {
      errors.push({
        field: 'menuItemId',
        message: 'Menu item ID is required',
        code: 'MISSING_MENU_ITEM_ID',
      });
    }

    // Simulate async availability check
    try {
      const isAvailable = await this.checkMenuItemAvailability(menuItemId);
      if (!isAvailable) {
        errors.push({
          field: 'menuItemId',
          message: 'This menu item is currently unavailable',
          code: 'MENU_ITEM_UNAVAILABLE',
        });
      }
    } catch (error) {
      errors.push({
        field: 'menuItemId',
        message: 'Unable to verify menu item availability',
        code: 'AVAILABILITY_CHECK_FAILED',
      });
    }

    return errors;
  }

  private async validateCustomizations(customizations: any[]): Promise<CartValidationError[]> {
    const errors: CartValidationError[] = []

    if (!Array.isArray(customizations)) {
      errors.push({
        field: 'customizations',
        message: 'Customizations must be an array',
        code: 'INVALID_CUSTOMIZATIONS_TYPE',
      });
      return errors;
    }

    for (let i = 0; i < customizations.length; i++) {
      const customization = customizations[i]
      const customizationErrors = await this.validateCustomization(customization);

      customizationErrors.forEach(error => {
        errors.push({
          ...error,
          field: `customizations[${i}].${error.field}`,
        });
      });
    }

    return errors;
  }

  private async validateCustomization(customization: any): Promise<CartValidationError[]> {
    const errors: CartValidationError[] = []

    if (!customization.customizationId) {
      errors.push({
        field: 'customizationId',
        message: 'Customization ID is required',
        code: 'MISSING_CUSTOMIZATION_ID',
      });
    }

    if (!Array.isArray(customization.selectedOptions)) {
      errors.push({
        field: 'selectedOptions',
        message: 'Selected options must be an array',
        code: 'INVALID_SELECTED_OPTIONS_TYPE',
      });
    }

    // Additional customization validation would go here
    // e.g., checking if selected options are valid for the customization type

    return errors;
  }

  private validateItemCustomization(customization: any): CartValidationError[] {
    const errors: CartValidationError[] = []

    if (!customization.id) {
      errors.push({
        field: 'id',
        message: 'Customization ID is required',
        code: 'MISSING_CUSTOMIZATION_ID',
      });
    }

    if (!customization.name || customization.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Customization name is required',
        code: 'MISSING_CUSTOMIZATION_NAME',
      });
    }

    if (!Array.isArray(customization.options)) {
      errors.push({
        field: 'options',
        message: 'Customization options must be an array',
        code: 'INVALID_OPTIONS_TYPE',
      });
    } else {
      customization.options.forEach((option: any, index: number) => {
        if (!option.id) {
          errors.push({
            field: `options[${index}].id`,
            message: 'Option ID is required',
            code: 'MISSING_OPTION_ID',
          });
        }

        if (typeof option.priceModifier !== 'number') {
          errors.push({
            field: `options[${index}].priceModifier`,
            message: 'Price modifier must be a number',
            code: 'INVALID_PRICE_MODIFIER',
          });
        }
      });
    }

    return errors;
  }

  private async checkMenuItemAvailability(menuItemId: string): Promise<boolean> {
    // Simulate API call to check menu item availability
    return new Promise((resolve) => {
      setTimeout(() => {
        // For demo purposes, assume all items are available
        // In real implementation, this would call the menu service
        resolve(true);
      }, 100);
    });
  }

  // Public method to get validation configuration
  getValidationConfig(): CartConfig {
    return { ...this.config }
  }

  // Helper method to format validation errors for display
  formatErrorMessage(error: CartValidationError): string {
    switch (error.code) {
      case 'EMPTY_CART':
        return 'Your cart is empty. Add some items to continue.';
      case 'MINIMUM_ORDER_NOT_MET':
        return `Minimum order amount is $${this.config.minimumOrderAmount.toFixed(2)}`;
      case 'MAX_ITEMS_EXCEEDED':
        return `You can only have ${this.config.maxItems} items in your cart`;
      case 'QUANTITY_TOO_HIGH':
        return `Maximum quantity per item is ${this.config.maxQuantityPerItem}`;
      case 'CART_EXPIRED':
        return 'Your cart has expired. Please add items again.';
      default:
        return error.message;
    }
  }
}