import { Injectable, signal, computed, effect } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  Cart,
  CartItem,
  CartState,
  CartConfig,
  AddToCartRequest,
  UpdateCartItemRequest,
  CartValidationError,
  CartFee,
  CartAction,
} from '../models/cart.models';
import { CartStorageService } from './cart-storage.service';
import { CartValidationService } from './cart-validation.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly config: CartConfig = {
    maxItems: 50,
    maxQuantityPerItem: 10,
    taxRate: 0.08,
    serviceFeeRate: 0.03,
    deliveryFee: 2.99,
    minimumOrderAmount: 10.00,
    cartExpirationHours: 24,
  }

  // Signal-based state management
  private readonly _cartState = signal<CartState>({
    cart: null,
    isLoading: false,
    errors: [],
    lastUpdated: null,
  });

  // Read-only signals for components
  readonly cartState = this._cartState.asReadonly()
  readonly cart = computed(() => this._cartState().cart);
  readonly items = computed(() => this._cartState().cart?.items || []);
  readonly itemCount = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotal = computed(() => this.items().reduce((sum, item) => sum + item.totalPrice, 0));
  readonly isLoading = computed(() => this._cartState().isLoading);
  readonly errors = computed(() => this._cartState().errors);
  readonly isEmpty = computed(() => this.items().length === 0);
  readonly isValidForCheckout = computed(() => this.validateCartForCheckout().length === 0);

  // Computed pricing
  readonly tax = computed(() => this.calculateTax());
  readonly fees = computed(() => this.calculateFees());
  readonly total = computed(() => this.calculateTotal());

  // Event streams
  private readonly cartActionSubject = new Subject<{ action: CartAction; data?: any }>()
  readonly cartActions$ = this.cartActionSubject.asObservable()

  private readonly cartUpdateSubject = new Subject<Cart>()
  readonly cartUpdates$ = this.cartUpdateSubject.asObservable()

  constructor(
    private storageService: CartStorageService,
    private validationService: CartValidationService
  ) {
    this.initializeCart()
    this.setupCartPersistence()
  }

  private initializeCart(): void {
    const savedCart = this.storageService.loadCart()
    if (savedCart && this.isCartValid(savedCart)) {
      this.updateCartState({ cart: savedCart, lastUpdated: new Date() });
    } else {
      this.createNewCart()
    }
  }

  private setupCartPersistence(): void {
    effect(() => {
      const currentCart = this.cart()
      if (currentCart) {
        this.storageService.saveCart(currentCart);
      }
    });
  }

  private createNewCart(): void {
    const newCart: Cart = {
      id: this.generateCartId(),
      items: [],
      subtotal: 0,
      tax: 0,
      fees: [],
      discount: 0,
      total: 0,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.cartExpirationHours * 60 * 60 * 1000)
    }

    this.updateCartState({ cart: newCart, lastUpdated: new Date() });
  }

  private isCartValid(cart: Cart): boolean {
    const now = new Date()
    return cart.expiresAt ? new Date(cart.expiresAt) > now : true;
  }

  private updateCartState(partial: Partial<CartState>): void {
    this._cartState.update(current => ({
      ...current,
      ...partial,
      lastUpdated: partial.lastUpdated || new Date()
    }));
  }

  async addToCart(request: AddToCartRequest): Promise<void> {
    this.updateCartState({ isLoading: true, errors: [] });

    try {
      const validationErrors = await this.validationService.validateAddToCart(request, this.cart());
      if (validationErrors.length > 0) {
        this.updateCartState({ errors: validationErrors, isLoading: false });
        return;
      }

      const cartItem = await this.createCartItem(request);
      const currentCart = this.cart()

      if (!currentCart) {
        throw new Error('Cart not initialized');
      }

      // Check if item already exists with same customizations
      const existingItemIndex = this.findExistingItem(currentCart.items, cartItem);

      let updatedItems: CartItem[]
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        updatedItems = [...currentCart.items]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + cartItem.quantity,
          totalPrice: this.calculateItemTotal(updatedItems[existingItemIndex])
        }
      } else {
        // Add new item
        updatedItems = [...currentCart.items, cartItem]
      }

      const updatedCart = this.updateCartTotals({
        ...currentCart,
        items: updatedItems,
        updatedAt: new Date()
      });

      this.updateCartState({ cart: updatedCart, isLoading: false });
      this.cartActionSubject.next({ action: CartAction.ADD_ITEM, data: cartItem });
      this.cartUpdateSubject.next(updatedCart);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart';
      this.updateCartState({
        errors: [{ field: 'general', message: errorMessage, code: 'ADD_ITEM_ERROR' }],
        isLoading: false,
      });
    }
  }

  async updateCartItem(request: UpdateCartItemRequest): Promise<void> {
    this.updateCartState({ isLoading: true, errors: [] });

    try {
      const currentCart = this.cart()
      if (!currentCart) {
        throw new Error('Cart not initialized');
      }

      const itemIndex = currentCart.items.findIndex(item => item.id === request.cartItemId);
      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      const validationErrors = await this.validationService.validateUpdateCartItem(request, currentCart);
      if (validationErrors.length > 0) {
        this.updateCartState({ errors: validationErrors, isLoading: false });
        return;
      }

      const updatedItems = [...currentCart.items];
      const currentItem = updatedItems[itemIndex]

      // Update item properties
      if (request.quantity !== undefined) {
        currentItem.quantity = request.quantity;
      }
      if (request.notes !== undefined) {
        currentItem.notes = request.notes;
      }
      if (request.customizations) {
        currentItem.customizations = await this.processCustomizations(request.customizations);
      }

      // Recalculate item total
      currentItem.totalPrice = this.calculateItemTotal(currentItem);

      const updatedCart = this.updateCartTotals({
        ...currentCart,
        items: updatedItems,
        updatedAt: new Date()
      });

      this.updateCartState({ cart: updatedCart, isLoading: false });
      this.cartActionSubject.next({ action: CartAction.UPDATE_ITEM, data: currentItem });
      this.cartUpdateSubject.next(updatedCart);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update cart item';
      this.updateCartState({
        errors: [{ field: 'general', message: errorMessage, code: 'UPDATE_ITEM_ERROR' }],
        isLoading: false,
      });
    }
  }

  removeCartItem(cartItemId: string): void {
    const currentCart = this.cart()
    if (!currentCart) return;

    const updatedItems = currentCart.items.filter(item => item.id !== cartItemId);
    const updatedCart = this.updateCartTotals({
      ...currentCart,
      items: updatedItems,
      updatedAt: new Date()
    });

    this.updateCartState({ cart: updatedCart });
    this.cartActionSubject.next({ action: CartAction.REMOVE_ITEM, data: { cartItemId } });
    this.cartUpdateSubject.next(updatedCart);
  }

  updateQuantity(cartItemId: string, quantity: number): void {
    if (quantity < 1 || quantity > this.config.maxQuantityPerItem) {
      return;
    }

    this.updateCartItem({ cartItemId, quantity });
  }

  clearCart(): void {
    this.createNewCart()
    this.cartActionSubject.next({ action: CartAction.CLEAR_CART });
  }

  private async createCartItem(request: AddToCartRequest): Promise<CartItem> {
    // This would typically fetch menu item details from a service
    // For now, we'll create a mock implementation
    const cartItem: CartItem = {
      id: this.generateItemId(),
      menuItemId: request.menuItemId,
      name: `Menu Item ${request.menuItemId}`, // Would come from menu service
      basePrice: 12.99, // Would come from menu service
      quantity: request.quantity,
      customizations: await this.processCustomizations(request.customizations || []),
      totalPrice: 0,
      category: 'main', // Would come from menu service
      notes: request.notes,
      addedAt: new Date()
    }

    cartItem.totalPrice = this.calculateItemTotal(cartItem);
    return cartItem;
  }

  private async processCustomizations(customizations: any[]): Promise<any[]> {
    // Process and validate customizations
    // This would typically interact with a menu service
    return customizations; // Simplified for now
  }

  private calculateItemTotal(item: CartItem): number {
    let total = item.basePrice * item.quantity;

    // Add customization costs
    item.customizations?.forEach(customization => {
      customization.options?.forEach(option => {
        if (option.selected) {
          total += option.priceModifier * item.quantity;
        }
      });
    });

    return Math.round(total * 100) / 100;
  }

  private calculateTax(): number {
    return Math.round(this.subtotal() * this.config.taxRate * 100) / 100;
  }

  private calculateFees(): CartFee[] {
    const fees: CartFee[] = []
    const subtotal = this.subtotal()

    if (subtotal > 0) {
      fees.push({
        id: 'service',
        name: 'Service Fee',
        amount: Math.round(subtotal * this.config.serviceFeeRate * 100) / 100,
        type: 'percentage',
        description: 'Service and processing fee'
      });

      fees.push({
        id: 'delivery',
        name: 'Delivery Fee',
        amount: this.config.deliveryFee,
        type: 'fixed',
        description: 'Delivery and handling fee'
      });
    }

    return fees;
  }

  private calculateTotal(): number {
    const subtotal = this.subtotal()
    const tax = this.tax()
    const feesTotal = this.fees().reduce((sum, fee) => sum + fee.amount, 0);

    return Math.round((subtotal + tax + feesTotal) * 100) / 100;
  }

  private updateCartTotals(cart: Cart): Cart {
    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = Math.round(subtotal * this.config.taxRate * 100) / 100;
    const fees = this.calculateFeesForAmount(subtotal);
    const feesTotal = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const total = Math.round((subtotal + tax + feesTotal - cart.discount) * 100) / 100;

    return {
      ...cart,
      subtotal,
      tax,
      fees,
      total
    }
  }

  private calculateFeesForAmount(subtotal: number): CartFee[] {
    const fees: CartFee[] = []

    if (subtotal > 0) {
      fees.push({
        id: 'service',
        name: 'Service Fee',
        amount: Math.round(subtotal * this.config.serviceFeeRate * 100) / 100,
        type: 'percentage'
      });

      fees.push({
        id: 'delivery',
        name: 'Delivery Fee',
        amount: this.config.deliveryFee,
        type: 'fixed'
      });
    }

    return fees;
  }

  private findExistingItem(items: CartItem[], newItem: CartItem): number {
    return items.findIndex(item =>
      item.menuItemId === newItem.menuItemId &&
      this.customizationsMatch(item.customizations, newItem.customizations)
    );
  }

  private customizationsMatch(existing: any[], newCustomizations: any[]): boolean {
    // Simplified comparison - would need more sophisticated logic
    return JSON.stringify(existing) === JSON.stringify(newCustomizations);
  }

  private validateCartForCheckout(): CartValidationError[] {
    const errors: CartValidationError[] = []
    const currentCart = this.cart()

    if (!currentCart || currentCart.items.length === 0) {
      errors.push({
        field: 'cart',
        message: 'Cart is empty',
        code: 'EMPTY_CART'
      });
    }

    if (this.subtotal() < this.config.minimumOrderAmount) {
      errors.push({
        field: 'total',
        message: `Minimum order amount is $${this.config.minimumOrderAmount}`,
        code: 'MINIMUM_ORDER_NOT_MET'
      });
    }

    return errors;
  }

  private generateCartId(): string {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public getters for configuration
  getConfig(): CartConfig {
    return { ...this.config }
  }

  canAddMoreItems(): boolean {
    return this.items().length < this.config.maxItems;
  }

  getMaxQuantityPerItem(): number {
    return this.config.maxQuantityPerItem;
  }
}