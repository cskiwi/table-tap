import { Injectable } from '@angular/core';
import { Cart } from '../models/cart.models';

@Injectable({
  providedIn: 'root',
})
export class CartStorageService {
  private readonly CART_STORAGE_KEY = 'tabletap_cart';
  private readonly CART_BACKUP_KEY = 'tabletap_cart_backup';

  saveCart(cart: Cart): void {
    try {
      // Save current cart
      const cartData = JSON.stringify(cart);
      localStorage.setItem(this.CART_STORAGE_KEY, cartData);

      // Keep a backup of the previous cart
      const existingCart = localStorage.getItem(this.CART_STORAGE_KEY);
      if (existingCart && existingCart !== cartData) {
        localStorage.setItem(this.CART_BACKUP_KEY, existingCart);
      }
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
      this.handleStorageError()
    }
  }

  loadCart(): Cart | null {
    try {
      const cartData = localStorage.getItem(this.CART_STORAGE_KEY);
      if (!cartData) {
        return null;
      }

      const cart = JSON.parse(cartData) as Cart;

      // Convert date strings back to Date objects
      cart.createdAt = new Date(cart.createdAt);
      cart.updatedAt = new Date(cart.updatedAt);
      if (cart.expiresAt) {
        cart.expiresAt = new Date(cart.expiresAt);
      }

      // Convert item dates
      cart.items.forEach(item => {
        item.addedAt = new Date(item.addedAt);
      });

      return this.validateCartStructure(cart) ? cart : null;
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      return this.attemptCartRecovery()
    }
  }

  clearCart(): void {
    try {
      localStorage.removeItem(this.CART_STORAGE_KEY);
      localStorage.removeItem(this.CART_BACKUP_KEY);
    } catch (error) {
      console.error('Failed to clear cart from localStorage:', error);
    }
  }

  hasStoredCart(): boolean {
    try {
      return localStorage.getItem(this.CART_STORAGE_KEY) !== null;
    } catch (error) {
      return false;
    }
  }

  getCartSize(): number {
    try {
      const cartData = localStorage.getItem(this.CART_STORAGE_KEY);
      return cartData ? new Blob([cartData]).size : 0;
    } catch (error) {
      return 0;
    }
  }

  exportCart(): string | null {
    try {
      return localStorage.getItem(this.CART_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to export cart:', error);
      return null;
    }
  }

  importCart(cartData: string): boolean {
    try {
      const cart = JSON.parse(cartData) as Cart;
      if (this.validateCartStructure(cart)) {
        this.saveCart(cart);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import cart:', error);
      return false;
    }
  }

  private validateCartStructure(cart: any): boolean {
    if (!cart || typeof cart !== 'object') {
      return false;
    }

    // Check required properties
    const requiredProps = ['id', 'items', 'subtotal', 'tax', 'total', 'currency', 'createdAt', 'updatedAt'];
    for (const prop of requiredProps) {
      if (!(prop in cart)) {
        return false;
      }
    }

    // Validate items array
    if (!Array.isArray(cart.items)) {
      return false;
    }

    // Validate each item
    for (const item of cart.items) {
      if (!this.validateCartItem(item)) {
        return false;
      }
    }

    return true;
  }

  private validateCartItem(item: any): boolean {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const requiredProps = ['id', 'menuItemId', 'name', 'basePrice', 'quantity', 'totalPrice', 'addedAt'];
    for (const prop of requiredProps) {
      if (!(prop in item)) {
        return false;
      }
    }

    // Validate data types
    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      return false;
    }

    if (typeof item.basePrice !== 'number' || item.basePrice < 0) {
      return false;
    }

    if (typeof item.totalPrice !== 'number' || item.totalPrice < 0) {
      return false;
    }

    return true;
  }

  private attemptCartRecovery(): Cart | null {
    try {
      console.log('Attempting cart recovery from backup...');
      const backupData = localStorage.getItem(this.CART_BACKUP_KEY);

      if (backupData) {
        const backupCart = JSON.parse(backupData) as Cart;

        // Convert dates
        backupCart.createdAt = new Date(backupCart.createdAt);
        backupCart.updatedAt = new Date(backupCart.updatedAt);
        if (backupCart.expiresAt) {
          backupCart.expiresAt = new Date(backupCart.expiresAt);
        }

        backupCart.items.forEach(item => {
          item.addedAt = new Date(item.addedAt);
        });

        if (this.validateCartStructure(backupCart)) {
          console.log('Cart recovered from backup');
          this.saveCart(backupCart); // Restore as current cart
          return backupCart;
        }
      }
    } catch (error) {
      console.error('Cart recovery failed:', error);
    }

    // Clear corrupted data
    this.clearCart()
    return null;
  }

  private handleStorageError(): void {
    // Check if localStorage is available and not full
    try {
      const testKey = 'test_storage';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      console.warn('localStorage is not available or full. Cart will not persist.');

      // Could implement alternative storage strategies here:
      // - sessionStorage fallback
      // - IndexedDB fallback
      // - Memory-only storage with warning to user
    }
  }

  // Utility methods for storage management
  getStorageInfo(): { used: number; available: boolean; quota?: number } {
    try {
      // Test localStorage availability
      const testKey = 'test_availability';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);

      // Calculate used space (approximate)
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      return {
        used,
        available: true,
      }
    } catch (error) {
      return {
        used: 0,
        available: false,
      }
    }
  }

  cleanupExpiredCarts(): void {
    try {
      const cartData = localStorage.getItem(this.CART_STORAGE_KEY);
      if (!cartData) return;

      const cart = JSON.parse(cartData) as Cart;
      if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
        console.log('Removing expired cart');
        this.clearCart()
      }
    } catch (error) {
      console.error('Failed to cleanup expired cart:', error);
    }
  }

  // Migration helpers for future versions
  migrateCartData(version: string): boolean {
    try {
      const cartData = localStorage.getItem(this.CART_STORAGE_KEY);
      if (!cartData) return true;

      // Add migration logic here when cart structure changes
      // For now, just validate current structure
      const cart = JSON.parse(cartData);
      return this.validateCartStructure(cart);
    } catch (error) {
      console.error('Cart migration failed:', error);
      return false;
    }
  }
}