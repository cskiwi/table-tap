import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, shareReplay } from 'rxjs/operators';

import {
  AppState,
  AuthState,
  OrderState,
  ProductState,
  InventoryState,
  UIState,
  OfflineState,
  Order,
  Product,
  ProductCategory,
  InventoryItem,
  NotificationMessage,
  User
} from '../core/types';

/**
 * Centralized state management service for the application
 * Manages global application state and provides reactive state updates
 */
@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  // Individual state subjects
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  });

  private orderStateSubject = new BehaviorSubject<OrderState>({
    currentOrder: null,
    orderHistory: [],
    cartItems: [],
    isLoading: false,
    error: null
  });

  private productStateSubject = new BehaviorSubject<ProductState>({
    products: [],
    categories: [],
    selectedCategory: null,
    isLoading: false,
    error: null
  });

  private inventoryStateSubject = new BehaviorSubject<InventoryState>({
    items: [],
    alerts: [],
    isLoading: false,
    error: null
  });

  private uiStateSubject = new BehaviorSubject<UIState>({
    theme: 'light',
    sidebarOpen: false,
    loading: false,
    notifications: []
  });

  private offlineStateSubject = new BehaviorSubject<OfflineState>({
    isOnline: navigator.onLine,
    pendingActions: [],
    lastSyncTime: null
  });

  // Combined app state observable
  public readonly appState$: Observable<AppState> = combineLatest([
    this.authStateSubject,
    this.orderStateSubject,
    this.productStateSubject,
    this.inventoryStateSubject,
    this.uiStateSubject,
    this.offlineStateSubject
  ]).pipe(
    map(([auth, orders, products, inventory, ui, offline]) => ({
      auth,
      orders,
      products,
      inventory,
      ui,
      offline
    })),
    shareReplay(1)
  );

  // Individual state observables
  public readonly authState$ = this.authStateSubject.asObservable();
  public readonly orderState$ = this.orderStateSubject.asObservable();
  public readonly productState$ = this.productStateSubject.asObservable();
  public readonly inventoryState$ = this.inventoryStateSubject.asObservable();
  public readonly uiState$ = this.uiStateSubject.asObservable();
  public readonly offlineState$ = this.offlineStateSubject.asObservable();

  // Derived observables
  public readonly isAuthenticated$ = this.authState$.pipe(
    map(state => state.isAuthenticated),
    distinctUntilChanged()
  );

  public readonly currentUser$ = this.authState$.pipe(
    map(state => state.user),
    distinctUntilChanged()
  );

  public readonly isLoading$ = combineLatest([
    this.authState$,
    this.orderState$,
    this.productState$,
    this.inventoryState$,
    this.uiState$
  ]).pipe(
    map(([auth, orders, products, inventory, ui]) =>
      auth.isLoading || orders.isLoading || products.isLoading || inventory.isLoading || ui.loading
    ),
    distinctUntilChanged()
  );

  public readonly hasErrors$ = combineLatest([
    this.authState$,
    this.orderState$,
    this.productState$,
    this.inventoryState$
  ]).pipe(
    map(([auth, orders, products, inventory]) =>
      !!(auth.error || orders.error || products.error || inventory.error)
    ),
    distinctUntilChanged()
  );

  public readonly cartItemCount$ = this.orderState$.pipe(
    map(state => state.cartItems.reduce((count, item) => count + item.quantity, 0)),
    distinctUntilChanged()
  );

  public readonly activeNotifications$ = this.uiState$.pipe(
    map(state => state.notifications.filter(n => !n.payload.id)),
    distinctUntilChanged()
  );

  public readonly isOnline$ = this.offlineState$.pipe(
    map(state => state.isOnline),
    distinctUntilChanged()
  );

  public readonly pendingActionsCount$ = this.offlineState$.pipe(
    map(state => state.pendingActions.length),
    distinctUntilChanged()
  );

  constructor() {
    // Listen for online/offline events
    this.setupOnlineStatusListener();

    // Setup state persistence
    this.setupStatePersistence();
  }

  // Auth State Methods
  updateAuthState(updates: Partial<AuthState>): void {
    const currentState = this.authStateSubject.value;
    this.authStateSubject.next({ ...currentState, ...updates });
  }

  setAuthUser(user: User | null): void {
    this.updateAuthState({ user, isAuthenticated: !!user });
  }

  setAuthLoading(loading: boolean): void {
    this.updateAuthState({ isLoading: loading });
  }

  setAuthError(error: string | null): void {
    this.updateAuthState({ error });
  }

  // Order State Methods
  updateOrderState(updates: Partial<OrderState>): void {
    const currentState = this.orderStateSubject.value;
    this.orderStateSubject.next({ ...currentState, ...updates });
  }

  setCurrentOrder(order: Order | null): void {
    this.updateOrderState({ currentOrder: order });
  }

  addToOrderHistory(order: Order): void {
    const currentState = this.orderStateSubject.value;
    const updatedHistory = [order, ...currentState.orderHistory];
    this.updateOrderState({ orderHistory: updatedHistory });
  }

  updateCartItems(items: any[]): void {
    this.updateOrderState({ cartItems: items });
  }

  clearCart(): void {
    this.updateOrderState({ cartItems: [] });
  }

  setOrderLoading(loading: boolean): void {
    this.updateOrderState({ isLoading: loading });
  }

  setOrderError(error: string | null): void {
    this.updateOrderState({ error });
  }

  // Product State Methods
  updateProductState(updates: Partial<ProductState>): void {
    const currentState = this.productStateSubject.value;
    this.productStateSubject.next({ ...currentState, ...updates });
  }

  setProducts(products: Product[]): void {
    this.updateProductState({ products });
  }

  updateProduct(productId: string, updates: Partial<Product>): void {
    const currentState = this.productStateSubject.value;
    const updatedProducts = currentState.products.map(product =>
      product.id === productId ? { ...product, ...updates } : product
    );
    this.updateProductState({ products: updatedProducts });
  }

  setCategories(categories: ProductCategory[]): void {
    this.updateProductState({ categories });
  }

  setSelectedCategory(categoryId: string | null): void {
    this.updateProductState({ selectedCategory: categoryId });
  }

  setProductLoading(loading: boolean): void {
    this.updateProductState({ isLoading: loading });
  }

  setProductError(error: string | null): void {
    this.updateProductState({ error });
  }

  // Inventory State Methods
  updateInventoryState(updates: Partial<InventoryState>): void {
    const currentState = this.inventoryStateSubject.value;
    this.inventoryStateSubject.next({ ...currentState, ...updates });
  }

  setInventoryItems(items: InventoryItem[]): void {
    this.updateInventoryState({ items });
  }

  updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): void {
    const currentState = this.inventoryStateSubject.value;
    const updatedItems = currentState.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    this.updateInventoryState({ items: updatedItems });
  }

  addInventoryAlert(alert: any): void {
    const currentState = this.inventoryStateSubject.value;
    const updatedAlerts = [alert, ...currentState.alerts];
    this.updateInventoryState({ alerts: updatedAlerts });
  }

  removeInventoryAlert(alertId: string): void {
    const currentState = this.inventoryStateSubject.value;
    const updatedAlerts = currentState.alerts.filter(alert => alert.payload.id !== alertId);
    this.updateInventoryState({ alerts: updatedAlerts });
  }

  setInventoryLoading(loading: boolean): void {
    this.updateInventoryState({ isLoading: loading });
  }

  setInventoryError(error: string | null): void {
    this.updateInventoryState({ error });
  }

  // UI State Methods
  updateUIState(updates: Partial<UIState>): void {
    const currentState = this.uiStateSubject.value;
    this.uiStateSubject.next({ ...currentState, ...updates });
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.updateUIState({ theme });
    // Apply theme to document
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
  }

  toggleTheme(): void {
    const currentTheme = this.uiStateSubject.value.theme;
    this.setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }

  setSidebarOpen(open: boolean): void {
    this.updateUIState({ sidebarOpen: open });
  }

  toggleSidebar(): void {
    const currentState = this.uiStateSubject.value;
    this.setSidebarOpen(!currentState.sidebarOpen);
  }

  setGlobalLoading(loading: boolean): void {
    this.updateUIState({ loading });
  }

  addNotification(notification: NotificationMessage): void {
    const currentState = this.uiStateSubject.value;
    const updatedNotifications = [notification, ...currentState.notifications];
    this.updateUIState({ notifications: updatedNotifications });

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      this.removeNotification(notification.payload.id);
    }, 5000);
  }

  removeNotification(notificationId: string): void {
    const currentState = this.uiStateSubject.value;
    const updatedNotifications = currentState.notifications.filter(
      n => n.payload.id !== notificationId
    );
    this.updateUIState({ notifications: updatedNotifications });
  }

  clearAllNotifications(): void {
    this.updateUIState({ notifications: [] });
  }

  // Offline State Methods
  updateOfflineState(updates: Partial<OfflineState>): void {
    const currentState = this.offlineStateSubject.value;
    this.offlineStateSubject.next({ ...currentState, ...updates });
  }

  setOnlineStatus(isOnline: boolean): void {
    this.updateOfflineState({ isOnline });

    if (isOnline) {
      // Trigger sync when coming back online
      this.syncPendingActions();
    }
  }

  addPendingAction(action: any): void {
    const currentState = this.offlineStateSubject.value;
    const updatedActions = [...currentState.pendingActions, action];
    this.updateOfflineState({ pendingActions: updatedActions });
  }

  removePendingAction(actionId: string): void {
    const currentState = this.offlineStateSubject.value;
    const updatedActions = currentState.pendingActions.filter(action => action.id !== actionId);
    this.updateOfflineState({ pendingActions: updatedActions });
  }

  clearPendingActions(): void {
    this.updateOfflineState({ pendingActions: [] });
  }

  setLastSyncTime(time: Date): void {
    this.updateOfflineState({ lastSyncTime: time });
  }

  // Utility Methods
  resetState(): void {
    this.authStateSubject.next({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });

    this.orderStateSubject.next({
      currentOrder: null,
      orderHistory: [],
      cartItems: [],
      isLoading: false,
      error: null
    });

    this.productStateSubject.next({
      products: [],
      categories: [],
      selectedCategory: null,
      isLoading: false,
      error: null
    });

    this.inventoryStateSubject.next({
      items: [],
      alerts: [],
      isLoading: false,
      error: null
    });

    this.uiStateSubject.next({
      theme: 'light',
      sidebarOpen: false,
      loading: false,
      notifications: []
    });

    this.offlineStateSubject.next({
      isOnline: navigator.onLine,
      pendingActions: [],
      lastSyncTime: null
    });
  }

  getCurrentState(): AppState {
    return {
      auth: this.authStateSubject.value,
      orders: this.orderStateSubject.value,
      products: this.productStateSubject.value,
      inventory: this.inventoryStateSubject.value,
      ui: this.uiStateSubject.value,
      offline: this.offlineStateSubject.value
    };
  }

  // Private Methods
  private setupOnlineStatusListener(): void {
    window.addEventListener('online', () => {
      this.setOnlineStatus(true);
    });

    window.addEventListener('offline', () => {
      this.setOnlineStatus(false);
    });
  }

  private setupStatePersistence(): void {
    // Save important state to localStorage
    this.authState$.subscribe(authState => {
      if (authState.user) {
        localStorage.setItem('app_user', JSON.stringify(authState.user));
      } else {
        localStorage.removeItem('app_user');
      }
    });

    this.uiState$.subscribe(uiState => {
      localStorage.setItem('app_ui_preferences', JSON.stringify({
        theme: uiState.theme,
        sidebarOpen: uiState.sidebarOpen
      }));
    });

    // Restore state on initialization
    this.restorePersistedState();
  }

  private restorePersistedState(): void {
    try {
      // Restore UI preferences
      const uiPreferences = localStorage.getItem('app_ui_preferences');
      if (uiPreferences) {
        const preferences = JSON.parse(uiPreferences);
        this.updateUIState(preferences);
        this.setTheme(preferences.theme);
      }
    } catch (error) {
      console.error('Error restoring persisted state:', error);
    }
  }

  private syncPendingActions(): void {
    const currentState = this.offlineStateSubject.value;

    if (currentState.pendingActions.length > 0) {
      console.log('Syncing', currentState.pendingActions.length, 'pending actions');

      // Here you would implement the actual sync logic
      // For now, just clear pending actions after a delay
      setTimeout(() => {
        this.clearPendingActions();
        this.setLastSyncTime(new Date());
      }, 2000);
    }
  }

  // Debug Methods
  getStateSnapshot(): any {
    return {
      timestamp: new Date(),
      state: this.getCurrentState()
    };
  }

  logStateSnapshot(): void {
    console.log('App State Snapshot:', this.getStateSnapshot());
  }
}