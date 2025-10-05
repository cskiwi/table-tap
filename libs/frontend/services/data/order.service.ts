import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap, switchMap, filter, distinctUntilChanged } from 'rxjs/operators';
import { gql } from 'apollo-angular';

import { BaseService } from '../core/base.service';
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  OrderType,
  ApiResponse,
  PaginationOptions,
  Product
} from '../core/types';

// GraphQL Queries
const GET_ORDERS = gql`
  query GetOrders($cafeId: ID!, $page: Int, $limit: Int, $status: OrderStatus, $filters: OrderFilters) {
    orders(cafeId: $cafeId, page: $page, limit: $limit, status: $status, filters: $filters) {
      data {
        id
        orderNumber
        customerId
        tableId
        status
        totalAmount
        subtotal
        tax
        tip
        paymentStatus
        orderType
        notes
        estimatedTime
        actualTime
        createdAt
        updatedAt
        items {
          id
          productId
          quantity
          unitPrice
          totalPrice
          notes
          product {
            id
            name
            price
            preparationTime
            imageUrl
          }
          customizations {
            id
            name
            value
            additionalPrice
          }
        }
      }
      metadata {
        total
        page
        limit
        hasNext
        hasPrevious
      }
    }
  }
`;

const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      orderNumber
      customerId
      tableId
      status
      totalAmount
      subtotal
      tax
      tip
      paymentStatus
      orderType
      notes
      estimatedTime
      actualTime
      createdAt
      updatedAt
      items {
        id
        productId
        quantity
        unitPrice
        totalPrice
        notes
        product {
          id
          name
          price
          preparationTime
          imageUrl
          description
        }
        customizations {
          id
          name
          value
          additionalPrice
        }
      }
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      orderNumber
      status
      totalAmount
      estimatedTime
    }
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!, $estimatedTime: Int) {
    updateOrderStatus(id: $id, status: $status, estimatedTime: $estimatedTime) {
      id
      status
      estimatedTime
      updatedAt
    }
  }
`;

const CANCEL_ORDER = gql`
  mutation CancelOrder($id: ID!, $reason: String) {
    cancelOrder(id: $id, reason: $reason) {
      id
      status
      updatedAt
    }
  }
`;

export interface CreateOrderInput {
  customerId?: string;
  tableId?: string;
  items: CreateOrderItemInput[]
  orderType: OrderType;
  notes?: string;
  cafeId: string;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  customizations?: {
    id: string;
    value: string;
  }[]
  notes?: string;
}

export interface OrderFilters {
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  tableId?: string;
  orderType?: OrderType;
  paymentStatus?: PaymentStatus;
}

/**
 * Service for managing restaurant orders with real-time updates
 * Integrates with GraphQL API and provides comprehensive order management
 */
@Injectable({
  providedIn: 'root'
})
export class OrderService extends BaseService {
  // State management
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private currentOrderSubject = new BehaviorSubject<Order | null>(null);
  private cartItemsSubject = new BehaviorSubject<OrderItem[]>([]);
  private cartTotalSubject = new BehaviorSubject<number>(0);

  // Observables
  public readonly orders$ = this.ordersSubject.asObservable()
  public readonly currentOrder$ = this.currentOrderSubject.asObservable()
  public readonly cartItems$ = this.cartItemsSubject.asObservable()
  public readonly cartTotal$ = this.cartTotalSubject.asObservable()
  public readonly cartItemCount$ = this.cartItems$.pipe(
    map(items => items.reduce((count, item) => count + item.quantity, 0))
  );

  // Loading states
  public readonly isLoadingOrders$ = this.getLoading('orders');
  public readonly isCreatingOrder$ = this.getLoading('createOrder');
  public readonly isUpdatingOrder$ = this.getLoading('updateOrder');

  constructor() {
    super()

    // Calculate cart total when items change
    this.cartItems$.subscribe(items => {
      const total = this.calculateCartTotal(items);
      this.cartTotalSubject.next(total);
    });
  }

  /**
   * Get orders with pagination and filtering
   */
  getOrders(
    cafeId: string,
    options?: PaginationOptions & { status?: OrderStatus; filters?: OrderFilters }
  ): Observable<ApiResponse<Order[]>> {
    this.setLoading('orders', true);

    const variables = {
      cafeId,
      page: options?.page,
      limit: options?.limit,
      status: options?.status,
      filters: options?.filters
    }

    return this.query<{ orders: ApiResponse<Order[]> }>(GET_ORDERS, variables, {
      useCache: true,
      cacheTTL: 60000 // 1 minute cache for orders
    }).pipe(
      map(response => response.orders),
      tap(response => {
        this.ordersSubject.next(response.data);
        this.setLoading('orders', false);
      })
    );
  }

  /**
   * Get orders by status with real-time updates
   */
  getOrdersByStatus(cafeId: string, status: OrderStatus): Observable<Order[]> {
    return this.getOrders(cafeId, { status }).pipe(
      map(response => response.data),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );
  }

  /**
   * Get pending orders (for kitchen display)
   */
  getPendingOrders(cafeId: string): Observable<Order[]> {
    return this.getOrdersByStatus(cafeId, OrderStatus.PENDING);
  }

  /**
   * Get orders in preparation (for kitchen display)
   */
  getPreparingOrders(cafeId: string): Observable<Order[]> {
    return this.getOrdersByStatus(cafeId, OrderStatus.PREPARING);
  }

  /**
   * Get ready orders (for pickup/serving)
   */
  getReadyOrders(cafeId: string): Observable<Order[]> {
    return this.getOrdersByStatus(cafeId, OrderStatus.READY);
  }

  /**
   * Get single order by ID
   */
  getOrder(id: string): Observable<Order> {
    this.setLoading('order', true);

    return this.query<{ order: Order }>(GET_ORDER, { id }, {
      useCache: true,
      cacheTTL: 30000 // 30 seconds cache
    }).pipe(
      map(response => response.order),
      tap(order => {
        this.currentOrderSubject.next(order);
        this.setLoading('order', false);
      })
    );
  }

  /**
   * Create new order
   */
  createOrder(input: CreateOrderInput): Observable<Order> {
    this.setLoading('createOrder', true);

    // Calculate totals before creating order
    const processedInput = this.processOrderInput(input);

    return this.mutate<{ createOrder: Order }>(CREATE_ORDER, { input: processedInput }).pipe(
      map(response => response.createOrder),
      tap(order => {
        // Update local state
        const currentOrders = this.ordersSubject.value;
        this.ordersSubject.next([order, ...currentOrders]);
        this.currentOrderSubject.next(order);

        // Clear cart if this was a cart order
        this.clearCart()

        this.setLoading('createOrder', false);

        // Clear relevant cache
        this.clearCacheByPattern('orders');
      })
    );
  }

  /**
   * Update order status
   */
  updateOrderStatus(
    id: string,
    status: OrderStatus,
    estimatedTime?: number
  ): Observable<Order> {
    this.setLoading('updateOrder', true);

    return this.mutate<{ updateOrderStatus: Order }>(
      UPDATE_ORDER_STATUS,
      { id, status, estimatedTime }
    ).pipe(
      map(response => response.updateOrderStatus),
      tap(updatedOrder => {
        // Update local state
        this.updateOrderInState(updatedOrder);
        this.setLoading('updateOrder', false);

        // Clear relevant cache
        this.clearCacheByPattern('orders');
      })
    );
  }

  /**
   * Cancel order
   */
  cancelOrder(id: string, reason?: string): Observable<Order> {
    this.setLoading('updateOrder', true);

    return this.mutate<{ cancelOrder: Order }>(CANCEL_ORDER, { id, reason }).pipe(
      map(response => response.cancelOrder),
      tap(cancelledOrder => {
        this.updateOrderInState(cancelledOrder);
        this.setLoading('updateOrder', false);

        // Clear relevant cache
        this.clearCacheByPattern('orders');
      })
    );
  }

  /**
   * Add item to cart
   */
  addToCart(product: Product, quantity: number = 1, customizations?: any[], notes?: string): void {
    const currentItems = this.cartItemsSubject.value;

    // Create order item
    const orderItem: OrderItem = {
      id: this.generateTempId(),
      productId: product.id,
      product,
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
      customizations: customizations || [],
      notes
    }

    // Check if item with same customizations already exists
    const existingItemIndex = currentItems.findIndex(item =>
      item.productId === product.id &&
      JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );

    if (existingItemIndex > -1) {
      // Update existing item
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity,
        totalPrice: (updatedItems[existingItemIndex].quantity + quantity) * product.price
      }
      this.cartItemsSubject.next(updatedItems);
    } else {
      // Add new item
      this.cartItemsSubject.next([...currentItems, orderItem]);
    }
  }

  /**
   * Update cart item quantity
   */
  updateCartItemQuantity(itemId: string, quantity: number): void {
    const currentItems = this.cartItemsSubject.value;

    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const updatedItems = currentItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          totalPrice: quantity * item.unitPrice
        }
      }
      return item;
    });

    this.cartItemsSubject.next(updatedItems);
  }

  /**
   * Remove item from cart
   */
  removeFromCart(itemId: string): void {
    const currentItems = this.cartItemsSubject.value;
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    this.cartItemsSubject.next(updatedItems);
  }

  /**
   * Clear cart
   */
  clearCart(): void {
    this.cartItemsSubject.next([]);
  }

  /**
   * Create order from cart
   */
  createOrderFromCart(
    cafeId: string,
    orderType: OrderType,
    tableId?: string,
    customerId?: string,
    notes?: string
  ): Observable<Order> {
    const cartItems = this.cartItemsSubject.value;

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    const orderInput: CreateOrderInput = {
      cafeId,
      orderType,
      tableId,
      customerId,
      notes,
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        customizations: item.customizations?.map(c => ({
          id: c.id,
          value: c.value
        })),
        notes: item.notes
      }))
    }

    return this.createOrder(orderInput);
  }

  /**
   * Get order statistics for dashboard
   */
  getOrderStats(cafeId: string, startDate?: Date, endDate?: Date): Observable<any> {
    const filters: OrderFilters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    return this.getOrders(cafeId, { filters }).pipe(
      map(response => {
        const orders = response.data;
        return {
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
          averageOrderValue: orders.length > 0
            ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length
            : 0,
          ordersByStatus: {
            pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
            preparing: orders.filter(o => o.status === OrderStatus.PREPARING).length,
            ready: orders.filter(o => o.status === OrderStatus.READY).length,
            completed: orders.filter(o => o.status === OrderStatus.COMPLETED).length,
            cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length
          },
          ordersByType: {
            dineIn: orders.filter(o => o.orderType === OrderType.DINE_IN).length,
            takeaway: orders.filter(o => o.orderType === OrderType.TAKEAWAY).length,
            delivery: orders.filter(o => o.orderType === OrderType.DELIVERY).length
          }
        }
      })
    );
  }

  /**
   * Process order input to calculate totals
   */
  private processOrderInput(input: CreateOrderInput): CreateOrderInput {
    // This would typically include tax calculation, discounts, etc.
    // For now, just return the input as-is since totals are calculated on backend
    return input;
  }

  /**
   * Update order in local state
   */
  private updateOrderInState(updatedOrder: Order): void {
    // Update orders list
    const currentOrders = this.ordersSubject.value;
    const updatedOrders = currentOrders.map(order =>
      order.id === updatedOrder.id ? updatedOrder : order
    );
    this.ordersSubject.next(updatedOrders);

    // Update current order if it's the same
    const currentOrder = this.currentOrderSubject.value;
    if (currentOrder && currentOrder.id === updatedOrder.id) {
      this.currentOrderSubject.next(updatedOrder);
    }
  }

  /**
   * Calculate cart total including customizations
   */
  private calculateCartTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => {
      const customizationTotal = item.customizations?.reduce(
        (sum, custom) => sum + custom.additionalPrice,
        0
      ) || 0;

      return total + (item.unitPrice + customizationTotal) * item.quantity;
    }, 0);
  }

  /**
   * Generate temporary ID for cart items
   */
  private generateTempId(): string {
    return 'temp_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Handle real-time order updates (to be called by WebSocket service)
   */
  public handleOrderUpdate(orderUpdate: { orderId: string; status: OrderStatus; estimatedTime?: number }): void {
    const currentOrders = this.ordersSubject.value;
    const updatedOrders = currentOrders.map(order => {
      if (order.id === orderUpdate.orderId) {
        return {
          ...order,
          status: orderUpdate.status,
          estimatedTime: orderUpdate.estimatedTime || order.estimatedTime,
          updatedAt: new Date()
        }
      }
      return order;
    });

    this.ordersSubject.next(updatedOrders);

    // Update current order if it matches
    const currentOrder = this.currentOrderSubject.value;
    if (currentOrder && currentOrder.id === orderUpdate.orderId) {
      this.currentOrderSubject.next({
        ...currentOrder,
        status: orderUpdate.status,
        estimatedTime: orderUpdate.estimatedTime || currentOrder.estimatedTime,
        updatedAt: new Date()
      });
    }
  }
}