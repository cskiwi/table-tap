# TableTap Service Layer Specifications

## Overview

This document defines the comprehensive service layer architecture for the TableTap restaurant management application, including Apollo Client setup, state management patterns, error handling, and inter-service communication.

## 1. Service Architecture Overview

### 1.1 Service Layer Structure

```
Services Layer
├── Core Services
│   ├── Apollo Client (GraphQL)
│   ├── Authentication Service
│   ├── Error Handler Service
│   └── Notification Service
├── Domain Services
│   ├── Menu Service
│   ├── Order Service
│   ├── Cart Service
│   ├── Kitchen Service
│   ├── Admin Service
│   └── Loyalty Service
├── Infrastructure Services
│   ├── Storage Service
│   ├── WebSocket Service
│   ├── Performance Service
│   └── Analytics Service
└── Utility Services
    ├── Permission Service
    ├── Navigation Service
    ├── Meta Tag Service
    └── Theme Service
```

### 1.2 Service Communication Patterns

```typescript
// Service communication hierarchy
interface ServiceCommunication {
  directInjection: 'For core dependencies';
  eventBus: 'For loose coupling between modules';
  stateManagement: 'For shared state across components';
  graphql: 'For server communication';
}
```

## 2. Apollo Client Configuration

### 2.1 Enhanced Apollo Setup

```typescript
// libs/frontend/modules/graphql/src/enhanced-apollo.config.ts
import { Injectable, InjectionToken } from '@angular/core';
import {
  ApolloLink,
  InMemoryCache,
  NormalizedCacheObject,
  from,
  split
} from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';

export const ENHANCED_APOLLO_CONFIG = new InjectionToken<EnhancedApolloConfig>(
  'enhanced.apollo.config'
);

export interface EnhancedApolloConfig {
  httpUri: string;
  wsUri: string;
  retryAttempts: number;
  cachePersistence: boolean;
  errorLogging: boolean;
}

@Injectable({ providedIn: 'root' })
export class EnhancedApolloService {
  createApollo(config: EnhancedApolloConfig) {
    // Error handling link
    const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => {
          console.error(
            `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
          );
        });
      }

      if (networkError) {
        console.error(`Network error: ${networkError}`);

        // Handle specific network errors
        if (networkError.statusCode === 401) {
          this.authService.redirectToLogin();
        }
      }
    });

    // Retry link for network resilience
    const retryLink = new RetryLink({
      delay: {
        initial: 300,
        max: Infinity,
        jitter: true
      },
      attempts: {
        max: config.retryAttempts,
        retryIf: (error, _operation) => !!error
      }
    });

    // HTTP link for queries and mutations
    const httpLink = this.httpLink.create({
      uri: config.httpUri
    });

    // WebSocket link for subscriptions
    const wsLink = new GraphQLWsLink(
      createClient({
        url: config.wsUri,
        connectionParams: () => ({
          authorization: this.authService.getAuthToken()
        }),
        retryAttempts: config.retryAttempts
      })
    );

    // Split link: send subscriptions to WebSocket, others to HTTP
    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink
    );

    // Authentication link
    const authLink = new ApolloLink((operation, forward) => {
      const token = this.authService.getAuthToken();

      operation.setContext({
        headers: {
          authorization: token ? `Bearer ${token}` : ''
        }
      });

      return forward(operation);
    });

    // Enhanced cache configuration
    const cache = new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            orders: {
              keyArgs: ['status', 'customerId'],
              merge(existing = [], incoming) {
                return [...existing, ...incoming];
              }
            },
            menuItems: {
              keyArgs: ['categoryId'],
              merge(existing = [], incoming) {
                return incoming;
              }
            },
            kitchenOrders: {
              keyArgs: false,
              merge(existing = [], incoming) {
                return incoming;
              }
            }
          }
        },
        Order: {
          fields: {
            items: {
              merge(existing = [], incoming) {
                return incoming;
              }
            }
          }
        },
        CartItem: {
          keyFields: ['productId', 'customizations']
        }
      }
    });

    return {
      link: from([errorLink, retryLink, authLink, splitLink]),
      cache,
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
          fetchPolicy: 'cache-and-network'
        },
        query: {
          errorPolicy: 'all',
          fetchPolicy: 'cache-first'
        },
        mutate: {
          errorPolicy: 'all'
        }
      }
    };
  }
}
```

### 2.2 GraphQL Operation Services

```typescript
// libs/frontend/modules/graphql/src/services/graphql-operations.service.ts
@Injectable({ providedIn: 'root' })
export class GraphQLOperationsService {
  constructor(
    private apollo: Apollo,
    private errorHandler: ErrorHandlerService,
    private loadingService: LoadingService
  ) {}

  // Generic query method with loading and error handling
  query<T>(
    query: DocumentNode,
    variables?: any,
    options?: Partial<QueryOptions>
  ): Observable<T> {
    const operationId = this.generateOperationId();
    this.loadingService.setLoading(operationId, true);

    return this.apollo.query<T>({
      query,
      variables,
      ...options
    }).pipe(
      map(result => result.data),
      catchError(error => {
        this.errorHandler.handleGraphQLError(error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.loadingService.setLoading(operationId, false);
      })
    );
  }

  // Generic mutation method with optimistic updates
  mutate<T>(
    mutation: DocumentNode,
    variables?: any,
    optimisticResponse?: any,
    update?: MutationUpdaterFunction<T>
  ): Observable<T> {
    return this.apollo.mutate<T>({
      mutation,
      variables,
      optimisticResponse,
      update,
      errorPolicy: 'all'
    }).pipe(
      map(result => result.data),
      catchError(error => {
        this.errorHandler.handleGraphQLError(error);
        return throwError(() => error);
      })
    );
  }

  // Subscription method with automatic reconnection
  subscribe<T>(
    subscription: DocumentNode,
    variables?: any
  ): Observable<T> {
    return this.apollo.subscribe<T>({
      query: subscription,
      variables
    }).pipe(
      map(result => result.data),
      retry({
        count: 3,
        delay: (error, retryCount) => timer(Math.pow(2, retryCount) * 1000)
      }),
      catchError(error => {
        this.errorHandler.handleGraphQLError(error);
        return EMPTY;
      })
    );
  }

  private generateOperationId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
```

## 3. Domain Service Specifications

### 3.1 Menu Service

```typescript
// libs/frontend/modules/menu/src/lib/services/menu.service.ts
@Injectable({ providedIn: 'root' })
export class MenuService {
  constructor(
    private graphqlOps: GraphQLOperationsService,
    private cacheService: CacheService
  ) {}

  // Get all menu categories
  getCategories(): Observable<MenuCategory[]> {
    return this.graphqlOps.query<{ categories: MenuCategory[] }>(
      GET_MENU_CATEGORIES
    ).pipe(
      map(data => data.categories),
      tap(categories => this.cacheService.set('menu.categories', categories, 300))
    );
  }

  // Get menu items by category
  getItemsByCategory(categoryId: string): Observable<MenuItem[]> {
    return this.graphqlOps.query<{ menuItems: MenuItem[] }>(
      GET_MENU_ITEMS_BY_CATEGORY,
      { categoryId }
    ).pipe(
      map(data => data.menuItems)
    );
  }

  // Search menu items
  searchItems(query: string, filters?: MenuFilters): Observable<MenuItem[]> {
    return this.graphqlOps.query<{ searchMenuItems: MenuItem[] }>(
      SEARCH_MENU_ITEMS,
      { query, filters }
    ).pipe(
      map(data => data.searchMenuItems)
    );
  }

  // Get single menu item with details
  getMenuItem(itemId: string): Observable<MenuItem> {
    return this.graphqlOps.query<{ menuItem: MenuItem }>(
      GET_MENU_ITEM_DETAILS,
      { itemId }
    ).pipe(
      map(data => data.menuItem)
    );
  }

  // Get featured items
  getFeaturedItems(): Observable<MenuItem[]> {
    return this.graphqlOps.query<{ featuredItems: MenuItem[] }>(
      GET_FEATURED_ITEMS
    ).pipe(
      map(data => data.featuredItems)
    );
  }

  // Subscribe to menu updates
  subscribeToMenuUpdates(): Observable<MenuUpdateEvent> {
    return this.graphqlOps.subscribe<{ menuUpdated: MenuUpdateEvent }>(
      MENU_UPDATES_SUBSCRIPTION
    ).pipe(
      map(data => data.menuUpdated)
    );
  }
}
```

### 3.2 Order Service

```typescript
// libs/frontend/modules/order/src/lib/services/order.service.ts
@Injectable({ providedIn: 'root' })
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  constructor(
    private graphqlOps: GraphQLOperationsService,
    private cartService: CartService,
    private notificationService: NotificationService
  ) {}

  // Create new order from cart
  createOrder(orderInput: CreateOrderInput): Observable<Order> {
    const optimisticResponse = {
      createOrder: {
        ...orderInput,
        id: 'temp-' + Date.now(),
        status: OrderStatus.PENDING,
        createdAt: new Date().toISOString(),
        __typename: 'Order'
      }
    };

    return this.graphqlOps.mutate<{ createOrder: Order }>(
      CREATE_ORDER_MUTATION,
      { input: orderInput },
      optimisticResponse,
      (cache, { data }) => {
        if (data?.createOrder) {
          this.updateOrdersCache(cache, data.createOrder);
        }
      }
    ).pipe(
      map(data => data.createOrder),
      tap(order => {
        this.cartService.clearCart();
        this.notificationService.showSuccess('Order placed successfully!');
      })
    );
  }

  // Get user orders
  getUserOrders(): Observable<Order[]> {
    return this.graphqlOps.query<{ userOrders: Order[] }>(
      GET_USER_ORDERS
    ).pipe(
      map(data => data.userOrders),
      tap(orders => this.ordersSubject.next(orders))
    );
  }

  // Get single order
  getOrder(orderId: string): Observable<Order> {
    return this.graphqlOps.query<{ order: Order }>(
      GET_ORDER_DETAILS,
      { orderId }
    ).pipe(
      map(data => data.order)
    );
  }

  // Update order status
  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
    return this.graphqlOps.mutate<{ updateOrderStatus: Order }>(
      UPDATE_ORDER_STATUS,
      { orderId, status }
    ).pipe(
      map(data => data.updateOrderStatus)
    );
  }

  // Cancel order
  cancelOrder(orderId: string, reason?: string): Observable<Order> {
    return this.graphqlOps.mutate<{ cancelOrder: Order }>(
      CANCEL_ORDER_MUTATION,
      { orderId, reason }
    ).pipe(
      map(data => data.cancelOrder),
      tap(() => {
        this.notificationService.showInfo('Order cancelled successfully');
      })
    );
  }

  // Subscribe to order updates
  subscribeToOrderUpdates(userId?: string): Observable<OrderUpdateEvent> {
    return this.graphqlOps.subscribe<{ orderUpdated: OrderUpdateEvent }>(
      ORDER_UPDATES_SUBSCRIPTION,
      { userId }
    ).pipe(
      map(data => data.orderUpdated),
      tap(event => {
        this.handleOrderUpdate(event);
      })
    );
  }

  private handleOrderUpdate(event: OrderUpdateEvent): void {
    const currentOrders = this.ordersSubject.value;
    const updatedOrders = currentOrders.map(order =>
      order.id === event.orderId ? { ...order, ...event.changes } : order
    );
    this.ordersSubject.next(updatedOrders);

    // Show notification for status changes
    if (event.changes.status) {
      this.notificationService.showInfo(
        `Order #${event.orderId.slice(-6)} status updated to ${event.changes.status}`
      );
    }
  }

  private updateOrdersCache(cache: any, newOrder: Order): void {
    const existingOrders = cache.readQuery({
      query: GET_USER_ORDERS
    })?.userOrders || [];

    cache.writeQuery({
      query: GET_USER_ORDERS,
      data: {
        userOrders: [newOrder, ...existingOrders]
      }
    });
  }
}
```

### 3.3 Cart Service

```typescript
// libs/frontend/modules/cart/src/lib/services/cart.service.ts
@Injectable({ providedIn: 'root' })
export class CartService {
  private cartSubject = new BehaviorSubject<CartState>(this.getInitialCartState());
  public cart$ = this.cartSubject.asObservable();

  constructor(
    private storageService: StorageService,
    private menuService: MenuService,
    private validationService: CartValidationService
  ) {
    this.loadCartFromStorage();
  }

  // Add item to cart
  addItem(item: MenuItem, quantity: number = 1, customizations?: Customization[]): void {
    const currentCart = this.cartSubject.value;
    const cartItem: CartItem = {
      id: this.generateCartItemId(item.id, customizations),
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      customizations: customizations || [],
      subtotal: this.calculateItemSubtotal(item.price, quantity, customizations)
    };

    const existingItemIndex = currentCart.items.findIndex(
      cartItem => cartItem.id === cartItem.id
    );

    let updatedItems: CartItem[];
    if (existingItemIndex >= 0) {
      updatedItems = currentCart.items.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updatedItems = [...currentCart.items, cartItem];
    }

    const updatedCart = this.calculateCartTotals({
      ...currentCart,
      items: updatedItems
    });

    this.updateCart(updatedCart);
  }

  // Remove item from cart
  removeItem(cartItemId: string): void {
    const currentCart = this.cartSubject.value;
    const updatedItems = currentCart.items.filter(item => item.id !== cartItemId);

    const updatedCart = this.calculateCartTotals({
      ...currentCart,
      items: updatedItems
    });

    this.updateCart(updatedCart);
  }

  // Update item quantity
  updateItemQuantity(cartItemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(cartItemId);
      return;
    }

    const currentCart = this.cartSubject.value;
    const updatedItems = currentCart.items.map(item =>
      item.id === cartItemId
        ? { ...item, quantity, subtotal: item.price * quantity }
        : item
    );

    const updatedCart = this.calculateCartTotals({
      ...currentCart,
      items: updatedItems
    });

    this.updateCart(updatedCart);
  }

  // Apply discount/coupon
  applyCoupon(couponCode: string): Observable<CartState> {
    return this.validationService.validateCoupon(couponCode).pipe(
      map(discount => {
        const currentCart = this.cartSubject.value;
        const updatedCart = this.calculateCartTotals({
          ...currentCart,
          discount,
          couponCode
        });

        this.updateCart(updatedCart);
        return updatedCart;
      })
    );
  }

  // Clear cart
  clearCart(): void {
    const emptyCart = this.getInitialCartState();
    this.updateCart(emptyCart);
  }

  // Save cart for later
  saveCart(): Observable<boolean> {
    const currentCart = this.cartSubject.value;
    return this.storageService.saveUserData('savedCart', currentCart).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Load saved cart
  loadSavedCart(): Observable<CartState> {
    return this.storageService.getUserData('savedCart').pipe(
      map(savedCart => savedCart || this.getInitialCartState()),
      tap(cart => this.updateCart(cart))
    );
  }

  // Validate cart before checkout
  validateCart(): Observable<CartValidationResult> {
    const currentCart = this.cartSubject.value;
    return this.validationService.validateCart(currentCart);
  }

  private updateCart(cart: CartState): void {
    this.cartSubject.next(cart);
    this.saveCartToStorage(cart);
  }

  private calculateCartTotals(cart: Partial<CartState>): CartState {
    const items = cart.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = cart.discount ? subtotal * cart.discount.percentage : 0;
    const taxRate = 0.08; // 8% tax
    const taxAmount = (subtotal - discountAmount) * taxRate;
    const total = subtotal - discountAmount + taxAmount;

    return {
      ...cart,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    } as CartState;
  }

  private calculateItemSubtotal(
    basePrice: number,
    quantity: number,
    customizations?: Customization[]
  ): number {
    const customizationCost = customizations?.reduce(
      (sum, custom) => sum + (custom.priceAdjustment || 0),
      0
    ) || 0;

    return (basePrice + customizationCost) * quantity;
  }

  private generateCartItemId(productId: string, customizations?: Customization[]): string {
    const customizationKey = customizations
      ?.map(c => `${c.id}:${c.value}`)
      .sort()
      .join('|') || '';

    return `${productId}-${btoa(customizationKey)}`;
  }

  private getInitialCartState(): CartState {
    return {
      items: [],
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,
      itemCount: 0,
      couponCode: null,
      discount: null
    };
  }

  private loadCartFromStorage(): void {
    const savedCart = this.storageService.getLocalData('cart');
    if (savedCart) {
      this.cartSubject.next(savedCart);
    }
  }

  private saveCartToStorage(cart: CartState): void {
    this.storageService.setLocalData('cart', cart);
  }
}
```

### 3.4 Kitchen Service

```typescript
// libs/frontend/modules/kitchen/src/lib/services/kitchen.service.ts
@Injectable({ providedIn: 'root' })
export class KitchenService {
  private kitchenOrdersSubject = new BehaviorSubject<KitchenOrder[]>([]);
  public kitchenOrders$ = this.kitchenOrdersSubject.asObservable();

  private metricsSubject = new BehaviorSubject<KitchenMetrics>(this.getInitialMetrics());
  public metrics$ = this.metricsSubject.asObservable();

  constructor(
    private graphqlOps: GraphQLOperationsService,
    private notificationService: NotificationService,
    private audioService: AudioService
  ) {}

  // Get kitchen order queue
  getKitchenOrders(status?: OrderStatus[]): Observable<KitchenOrder[]> {
    return this.graphqlOps.query<{ kitchenOrders: KitchenOrder[] }>(
      GET_KITCHEN_ORDERS,
      { status }
    ).pipe(
      map(data => data.kitchenOrders),
      tap(orders => this.kitchenOrdersSubject.next(orders))
    );
  }

  // Update order status in kitchen
  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    estimatedTime?: number
  ): Observable<KitchenOrder> {
    return this.graphqlOps.mutate<{ updateKitchenOrderStatus: KitchenOrder }>(
      UPDATE_KITCHEN_ORDER_STATUS,
      { orderId, status, estimatedTime }
    ).pipe(
      map(data => data.updateKitchenOrderStatus),
      tap(order => {
        this.updateLocalOrder(order);
        this.notificationService.showSuccess(
          `Order #${orderId.slice(-6)} status updated to ${status}`
        );
      })
    );
  }

  // Assign staff to order
  assignStaff(orderId: string, staffId: string): Observable<KitchenOrder> {
    return this.graphqlOps.mutate<{ assignOrderStaff: KitchenOrder }>(
      ASSIGN_ORDER_STAFF,
      { orderId, staffId }
    ).pipe(
      map(data => data.assignOrderStaff),
      tap(order => this.updateLocalOrder(order))
    );
  }

  // Start order preparation timer
  startOrderTimer(orderId: string): Observable<boolean> {
    return this.graphqlOps.mutate<{ startOrderTimer: boolean }>(
      START_ORDER_TIMER,
      { orderId }
    ).pipe(
      map(data => data.startOrderTimer),
      tap(() => {
        this.notificationService.showInfo(`Timer started for order #${orderId.slice(-6)}`);
      })
    );
  }

  // Mark order item as complete
  completeOrderItem(orderId: string, itemId: string): Observable<KitchenOrder> {
    return this.graphqlOps.mutate<{ completeOrderItem: KitchenOrder }>(
      COMPLETE_ORDER_ITEM,
      { orderId, itemId }
    ).pipe(
      map(data => data.completeOrderItem),
      tap(order => this.updateLocalOrder(order))
    );
  }

  // Get kitchen performance metrics
  getKitchenMetrics(timeRange: string): Observable<KitchenMetrics> {
    return this.graphqlOps.query<{ kitchenMetrics: KitchenMetrics }>(
      GET_KITCHEN_METRICS,
      { timeRange }
    ).pipe(
      map(data => data.kitchenMetrics),
      tap(metrics => this.metricsSubject.next(metrics))
    );
  }

  // Subscribe to new orders
  subscribeToNewOrders(): Observable<KitchenOrder> {
    return this.graphqlOps.subscribe<{ newKitchenOrder: KitchenOrder }>(
      NEW_KITCHEN_ORDER_SUBSCRIPTION
    ).pipe(
      map(data => data.newKitchenOrder),
      tap(order => {
        this.addNewOrder(order);
        this.audioService.playNewOrderSound();
        this.notificationService.showInfo(
          `New order received: #${order.id.slice(-6)}`
        );
      })
    );
  }

  // Subscribe to order updates
  subscribeToOrderUpdates(): Observable<KitchenOrderUpdate> {
    return this.graphqlOps.subscribe<{ kitchenOrderUpdated: KitchenOrderUpdate }>(
      KITCHEN_ORDER_UPDATES_SUBSCRIPTION
    ).pipe(
      map(data => data.kitchenOrderUpdated),
      tap(update => this.handleOrderUpdate(update))
    );
  }

  private updateLocalOrder(updatedOrder: KitchenOrder): void {
    const currentOrders = this.kitchenOrdersSubject.value;
    const updatedOrders = currentOrders.map(order =>
      order.id === updatedOrder.id ? updatedOrder : order
    );
    this.kitchenOrdersSubject.next(updatedOrders);
  }

  private addNewOrder(newOrder: KitchenOrder): void {
    const currentOrders = this.kitchenOrdersSubject.value;
    this.kitchenOrdersSubject.next([newOrder, ...currentOrders]);
  }

  private handleOrderUpdate(update: KitchenOrderUpdate): void {
    const currentOrders = this.kitchenOrdersSubject.value;
    const updatedOrders = currentOrders.map(order =>
      order.id === update.orderId
        ? { ...order, ...update.changes }
        : order
    );
    this.kitchenOrdersSubject.next(updatedOrders);
  }

  private getInitialMetrics(): KitchenMetrics {
    return {
      avgPreparationTime: 0,
      ordersInQueue: 0,
      ordersInProgress: 0,
      ordersCompleted: 0,
      efficiency: 0
    };
  }
}
```

## 4. State Management Architecture

### 4.1 Central State Service

```typescript
// src/app/services/state-management.service.ts
@Injectable({ providedIn: 'root' })
export class StateManagementService {
  private state$ = new BehaviorSubject<AppState>(this.getInitialState());

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private orderService: OrderService
  ) {
    this.initializeStateSubscriptions();
  }

  // Selectors
  selectAuth(): Observable<AuthState> {
    return this.state$.pipe(map(state => state.auth));
  }

  selectCart(): Observable<CartState> {
    return this.state$.pipe(map(state => state.cart));
  }

  selectOrders(): Observable<OrderState> {
    return this.state$.pipe(map(state => state.orders));
  }

  selectUI(): Observable<UIState> {
    return this.state$.pipe(map(state => state.ui));
  }

  // Actions
  updateAuthState(auth: Partial<AuthState>): void {
    this.updateState({ auth });
  }

  updateCartState(cart: Partial<CartState>): void {
    this.updateState({ cart });
  }

  updateOrderState(orders: Partial<OrderState>): void {
    this.updateState({ orders });
  }

  updateUIState(ui: Partial<UIState>): void {
    this.updateState({ ui });
  }

  private updateState(partialState: Partial<AppState>): void {
    const currentState = this.state$.value;
    const newState = { ...currentState, ...partialState };
    this.state$.next(newState);
  }

  private initializeStateSubscriptions(): void {
    // Sync auth state
    this.authService.user$.subscribe(user => {
      this.updateAuthState({ user, isAuthenticated: !!user });
    });

    // Sync cart state
    this.cartService.cart$.subscribe(cart => {
      this.updateCartState(cart);
    });

    // Sync order state
    this.orderService.orders$.subscribe(orders => {
      this.updateOrderState({ orders });
    });
  }

  private getInitialState(): AppState {
    return {
      auth: {
        user: null,
        isAuthenticated: false,
        roles: [],
        permissions: []
      },
      cart: {
        items: [],
        total: 0,
        itemCount: 0
      },
      orders: {
        orders: [],
        currentOrder: null
      },
      ui: {
        theme: 'light',
        sidebarCollapsed: false,
        notifications: []
      }
    };
  }
}
```

### 4.2 State Persistence Service

```typescript
// src/app/services/state-persistence.service.ts
@Injectable({ providedIn: 'root' })
export class StatePersistenceService {
  private readonly STORAGE_KEY = 'tabletap_app_state';

  constructor(
    private storageService: StorageService,
    private stateManagement: StateManagementService
  ) {}

  // Save state to storage
  saveState(state: Partial<AppState>): void {
    try {
      const serializedState = JSON.stringify(state);
      this.storageService.setLocalData(this.STORAGE_KEY, serializedState);
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  // Load state from storage
  loadState(): Observable<Partial<AppState> | null> {
    try {
      const serializedState = this.storageService.getLocalData(this.STORAGE_KEY);

      if (serializedState) {
        const state = JSON.parse(serializedState);
        return of(state);
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }

    return of(null);
  }

  // Clear persisted state
  clearState(): void {
    this.storageService.removeLocalData(this.STORAGE_KEY);
  }

  // Auto-save specific state slices
  enableAutoSave(slices: (keyof AppState)[]): void {
    this.stateManagement.state$.pipe(
      debounceTime(1000), // Save after 1 second of inactivity
      distinctUntilChanged()
    ).subscribe(state => {
      const stateToSave = slices.reduce((acc, slice) => {
        acc[slice] = state[slice];
        return acc;
      }, {} as Partial<AppState>);

      this.saveState(stateToSave);
    });
  }
}
```

## 5. Error Handling Strategy

### 5.1 Global Error Handler

```typescript
// src/app/services/error-handler.service.ts
@Injectable({ providedIn: 'root' })
export class ErrorHandlerService implements ErrorHandler {
  constructor(
    private notificationService: NotificationService,
    private loggingService: LoggingService,
    private router: Router
  ) {}

  handleError(error: any): void {
    // Log the error
    this.loggingService.logError(error);

    // Handle different error types
    if (error instanceof GraphQLError) {
      this.handleGraphQLError(error);
    } else if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error);
    } else if (error instanceof ChunkLoadError) {
      this.handleChunkLoadError(error);
    } else {
      this.handleGenericError(error);
    }
  }

  handleGraphQLError(error: GraphQLError): void {
    const extensions = error.extensions;

    switch (extensions?.['code']) {
      case 'UNAUTHENTICATED':
        this.notificationService.showError('Please log in to continue');
        this.router.navigate(['/auth/login']);
        break;
      case 'FORBIDDEN':
        this.notificationService.showError('Access denied');
        this.router.navigate(['/dashboard']);
        break;
      case 'VALIDATION_ERROR':
        this.notificationService.showError('Invalid input data');
        break;
      default:
        this.notificationService.showError('An error occurred. Please try again.');
    }
  }

  handleHttpError(error: HttpErrorResponse): void {
    switch (error.status) {
      case 0:
        this.notificationService.showError('No internet connection');
        break;
      case 401:
        this.notificationService.showError('Session expired. Please log in again.');
        this.router.navigate(['/auth/login']);
        break;
      case 403:
        this.notificationService.showError('Access forbidden');
        break;
      case 404:
        this.notificationService.showError('Resource not found');
        break;
      case 500:
        this.notificationService.showError('Server error. Please try again later.');
        break;
      default:
        this.notificationService.showError('Network error. Please check your connection.');
    }
  }

  handleChunkLoadError(error: ChunkLoadError): void {
    this.notificationService.showWarning('Loading error. Refreshing page...');
    setTimeout(() => window.location.reload(), 2000);
  }

  handleGenericError(error: any): void {
    console.error('Unhandled error:', error);
    this.notificationService.showError('An unexpected error occurred');
  }
}
```

### 5.2 Retry Strategy Service

```typescript
// src/app/services/retry-strategy.service.ts
@Injectable({ providedIn: 'root' })
export class RetryStrategyService {
  // Exponential backoff retry
  exponentialBackoff(maxRetries: number = 3, baseDelay: number = 1000) {
    return (errors: Observable<any>) =>
      errors.pipe(
        scan((acc, error) => ({ count: acc.count + 1, error }), { count: 0, error: null }),
        takeWhile(acc => acc.count < maxRetries),
        delay(acc => Math.pow(2, acc.count) * baseDelay),
        map(acc => {
          if (acc.count >= maxRetries) {
            throw acc.error;
          }
          return acc;
        })
      );
  }

  // Linear backoff retry
  linearBackoff(maxRetries: number = 3, delay: number = 1000) {
    return retry({
      count: maxRetries,
      delay: (error, retryCount) => timer(delay * retryCount)
    });
  }

  // Conditional retry based on error type
  conditionalRetry(
    condition: (error: any) => boolean,
    maxRetries: number = 3,
    delay: number = 1000
  ) {
    return (errors: Observable<any>) =>
      errors.pipe(
        scan((acc, error) => ({ count: acc.count + 1, error }), { count: 0, error: null }),
        takeWhile(acc => acc.count < maxRetries && condition(acc.error)),
        delay(delay),
        map(acc => {
          if (acc.count >= maxRetries || !condition(acc.error)) {
            throw acc.error;
          }
          return acc;
        })
      );
  }
}
```

## 6. Performance Optimization

### 6.1 Caching Service

```typescript
// src/app/services/cache.service.ts
@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 300000; // 5 minutes

  set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? Date.now() <= entry.expiresAt : false;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cached HTTP request wrapper
  cachedRequest<T>(
    key: string,
    request: () => Observable<T>,
    ttl?: number
  ): Observable<T> {
    const cachedValue = this.get<T>(key);

    if (cachedValue) {
      return of(cachedValue);
    }

    return request().pipe(
      tap(value => this.set(key, value, ttl))
    );
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

interface CacheEntry {
  value: any;
  expiresAt: number;
}
```

### 6.2 Loading State Service

```typescript
// src/app/services/loading.service.ts
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loadingStates = new Map<string, boolean>();
  private loadingSubject = new BehaviorSubject<Map<string, boolean>>(new Map());

  public loading$ = this.loadingSubject.asObservable();

  setLoading(key: string, loading: boolean): void {
    if (loading) {
      this.loadingStates.set(key, true);
    } else {
      this.loadingStates.delete(key);
    }

    this.loadingSubject.next(new Map(this.loadingStates));
  }

  isLoading(key: string): Observable<boolean> {
    return this.loading$.pipe(
      map(states => states.get(key) || false)
    );
  }

  isAnyLoading(): Observable<boolean> {
    return this.loading$.pipe(
      map(states => states.size > 0)
    );
  }

  // Loading decorator for methods
  withLoading<T>(key: string) {
    return (source: Observable<T>): Observable<T> => {
      this.setLoading(key, true);
      return source.pipe(
        finalize(() => this.setLoading(key, false))
      );
    };
  }
}
```

## 7. Implementation Checklist

### 7.1 Core Services Setup
- [ ] Enhanced Apollo Client configuration
- [ ] Error handling service implementation
- [ ] State management service setup
- [ ] Caching service implementation

### 7.2 Domain Services Implementation
- [ ] Menu service with GraphQL operations
- [ ] Order service with real-time updates
- [ ] Cart service with persistence
- [ ] Kitchen service with live updates

### 7.3 Infrastructure Services
- [ ] Loading state management
- [ ] Notification service
- [ ] Storage service
- [ ] Performance monitoring

### 7.4 Integration and Testing
- [ ] Service dependency injection
- [ ] Error handling integration
- [ ] Performance optimization
- [ ] Unit test coverage

---

**Document Version**: 1.0
**Last Updated**: 2025-09-26
**Status**: Ready for Implementation