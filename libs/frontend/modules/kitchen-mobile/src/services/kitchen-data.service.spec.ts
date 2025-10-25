import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { KitchenDataService } from './kitchen-data.service';
import { OfflineStorageService } from './storage/offline-storage.service';
import { OfflineSyncService } from './sync/offline-sync.service';
import { KitchenOrder, OrderStatus, OrderPriority, KitchenStation } from '../types';

describe('KitchenDataService', () => {
  let service: KitchenDataService;
  let httpMock: HttpTestingController;
  let mockStorageService: jest.Mocked<OfflineStorageService>;
  let mockSyncService: jest.Mocked<OfflineSyncService>;

  const mockOrder: KitchenOrder = {
    id: 'TEST-001',
    createdAt: new Date(),
    status: OrderStatus.PENDING,
    priority: OrderPriority.NORMAL,
    station: KitchenStation.GRILL,
    estimatedPrepTime: 15,
    items: [
      {
        id: 'item-1',
        name: 'Burger',
        quantity: 1,
        prepTime: 8,
        station: KitchenStation.GRILL,
        isReady: false
      }
    ],
    notes: ['No onions'],
    allergens: ['gluten']
  };

  beforeEach(() => {
    const storageSpy = {
      isReady$: { pipe: jest.fn().mockReturnValue({ toPromise: jest.fn().mockResolvedValue(true) }) },
      getOrders: jest.fn().mockResolvedValue([mockOrder]),
      getInventory: jest.fn().mockResolvedValue([]),
      getConfig: jest.fn().mockResolvedValue(null),
      saveOrder: jest.fn().mockResolvedValue(undefined),
      saveOrders: jest.fn().mockResolvedValue(undefined),
      saveInventoryItem: jest.fn().mockResolvedValue(undefined),
      saveConfig: jest.fn().mockResolvedValue(undefined),
      deleteOrder: jest.fn().mockResolvedValue(undefined),
      getInventoryByBarcode: jest.fn().mockResolvedValue(undefined),
      getLowStockItems: jest.fn().mockResolvedValue([])
    };

    const syncSpy = {
      isOnline: true,
      forcePullFromServer: jest.fn().mockResolvedValue(undefined),
      queueOperation: jest.fn().mockResolvedValue(undefined)
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        KitchenDataService,
        { provide: OfflineStorageService, useValue: storageSpy },
        { provide: OfflineSyncService, useValue: syncSpy }
      ]
    });

    service = TestBed.inject(KitchenDataService);
    httpMock = TestBed.inject(HttpTestingController);
    mockStorageService = TestBed.inject(OfflineStorageService) as jest.Mocked<OfflineStorageService>;
    mockSyncService = TestBed.inject(OfflineSyncService) as jest.Mocked<OfflineSyncService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Order Management', () => {
    it('should create a new order', async () => {
      const orderData = {
        station: KitchenStation.FRYER,
        priority: OrderPriority.HIGH,
        items: [{ name: 'Fries', quantity: 2 }]
      };

      const createdOrder = await service.createOrder(orderData);

      expect(createdOrder).toMatchObject(orderData);
      expect(createdOrder.id).toBeDefined();
      expect(createdOrder.createdAt).toBeInstanceOf(Date);
      expect(mockStorageService.saveOrder).toHaveBeenCalledWith(createdOrder);
      expect(mockSyncService.queueOperation).toHaveBeenCalled();
    });

    it('should update an existing order', async () => {
      // Setup initial orders
      jest.spyOn(service, 'orders', 'get').mockReturnValue(
        new BehaviorSubject([mockOrder]).asObservable()
      );

      const updates = { status: OrderStatus.IN_PROGRESS };
      await service.updateOrder(mockOrder.id, updates);

      expect(mockStorageService.saveOrder).toHaveBeenCalledWith(
        expect.objectContaining(updates)
      );
      expect(mockSyncService.queueOperation).toHaveBeenCalled();
    });

    it('should update order status', async () => {
      jest.spyOn(service, 'orders', 'get').mockReturnValue(
        new BehaviorSubject([mockOrder]).asObservable()
      );

      await service.updateOrderStatus(mockOrder.id, OrderStatus.COMPLETED);

      expect(mockStorageService.saveOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.COMPLETED
          completedAt: expect.any(Date)
        })
      );
    });

    it('should delete an order', async () => {
      jest.spyOn(service, 'orders', 'get').mockReturnValue(
        new BehaviorSubject([mockOrder]).asObservable()
      );

      await service.deleteOrder(mockOrder.id);

      expect(mockStorageService.deleteOrder).toHaveBeenCalledWith(mockOrder.id);
    });

    it('should throw error when updating non-existent order', async () => {
      jest.spyOn(service, 'orders', 'get').mockReturnValue(
        new BehaviorSubject([]).asObservable()
      );

      await expect(
        service.updateOrder('non-existent', { status: OrderStatus.COMPLETED })
      ).rejects.toThrow('Order not found');
    });
  });

  describe('Data Queries', () => {
    const orders = [
      { ...mockOrder, station: KitchenStation.GRILL }
      { ...mockOrder, id: 'TEST-002', station: KitchenStation.FRYER }
      { ...mockOrder, id: 'TEST-003', priority: OrderPriority.URGENT }
    ];

    beforeEach(() => {
      jest.spyOn(service, 'orders', 'get').mockReturnValue(
        new BehaviorSubject(orders).asObservable()
      );
    });

    it('should filter orders by station', (done) => {
      service.getOrdersByStation(KitchenStation.GRILL).subscribe(result => {
        expect(result).toHaveLength(1);
        expect(result[0].station).toBe(KitchenStation.GRILL);
        done();
      });
    });

    it('should filter orders by priority', (done) => {
      service.getOrdersByPriority(OrderPriority.URGENT).subscribe(result => {
        expect(result).toHaveLength(1);
        expect(result[0].priority).toBe(OrderPriority.URGENT);
        done();
      });
    });

    it('should get active orders only', (done) => {
      const ordersWithCompleted = [
        ...orders
        { ...mockOrder, id: 'TEST-004', status: OrderStatus.COMPLETED }
      ];

      jest.spyOn(service, 'orders', 'get').mockReturnValue(
        new BehaviorSubject(ordersWithCompleted).asObservable()
      );

      service.getActiveOrders().subscribe(result => {
        expect(result).toHaveLength(3);
        expect(result.every(o => o.status !== OrderStatus.COMPLETED)).toBe(true);
        done();
      });
    });

    it('should search orders by text', (done) => {
      const ordersWithItems = [
        {
          ...mockOrder
          items: [{ name: 'Cheeseburger', quantity: 1 }]
        }
        {
          ...mockOrder
          id: 'TEST-002'
          items: [{ name: 'Chicken Wings', quantity: 6 }]
        }
      ];

      jest.spyOn(service, 'orders', 'get').mockReturnValue(
        new BehaviorSubject(ordersWithItems).asObservable()
      );

      service.searchOrders('cheese').subscribe(result => {
        expect(result).toHaveLength(1);
        expect(result[0].items[0].name).toContain('Cheeseburger');
        done();
      });
    });
  });

  describe('Kitchen Stats', () => {
    it('should calculate kitchen statistics', (done) => {
      const orders = [
        { ...mockOrder, status: OrderStatus.COMPLETED }
        { ...mockOrder, id: 'TEST-002', status: OrderStatus.IN_PROGRESS, station: KitchenStation.GRILL }
        { ...mockOrder, id: 'TEST-003', status: OrderStatus.IN_PROGRESS, station: KitchenStation.FRYER }
      ];

      jest.spyOn(service, 'orders', 'get').mockReturnValue(
        new BehaviorSubject(orders).asObservable()
      );

      service.stats.subscribe(stats => {
        expect(stats.ordersCompleted).toBe(1);
        expect(stats.ordersInProgress).toBe(2);
        expect(stats.stationWorkload[KitchenStation.GRILL]).toBe(1);
        expect(stats.stationWorkload[KitchenStation.FRYER]).toBe(1);
        done();
      });
    });
  });

  describe('Inventory Management', () => {
    const mockInventoryItem = {
      id: 'INV-001'
      name: 'Ground Beef'
      currentStock: 5
      minStock: 10
      unit: 'lbs'
      lastUpdated: new Date()
      location: 'Freezer A'
    };

    it('should update inventory item', async () => {
      jest.spyOn(service, 'inventory', 'get').mockReturnValue(
        new BehaviorSubject([mockInventoryItem]).asObservable()
      );

      const updates = { currentStock: 8 };
      await service.updateInventoryItem(mockInventoryItem.id, updates);

      expect(mockStorageService.saveInventoryItem).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updates
          lastUpdated: expect.any(Date)
        })
      );
      expect(mockSyncService.queueOperation).toHaveBeenCalled();
    });

    it('should update inventory stock', async () => {
      jest.spyOn(service, 'inventory', 'get').mockReturnValue(
        new BehaviorSubject([mockInventoryItem]).asObservable()
      );

      await service.updateInventoryStock(mockInventoryItem.id, 12);

      expect(mockStorageService.saveInventoryItem).toHaveBeenCalledWith(
        expect.objectContaining({ currentStock: 12 })
      );
    });

    it('should get inventory by barcode', async () => {
      mockStorageService.getInventoryByBarcode.mockResolvedValue(mockInventoryItem);

      const result = await service.getInventoryByBarcode('123456');

      expect(result).toBe(mockInventoryItem);
      expect(mockStorageService.getInventoryByBarcode).toHaveBeenCalledWith('123456');
    });

    it('should get low stock items', async () => {
      const lowStockItems = [mockInventoryItem];
      mockStorageService.getLowStockItems.mockResolvedValue(lowStockItems);

      const result = await service.getLowStockItems(8);

      expect(result).toBe(lowStockItems);
      expect(mockStorageService.getLowStockItems).toHaveBeenCalledWith(8);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', async () => {
      const updates = { voiceControlEnabled: false };
      await service.updateConfig(updates);

      expect(mockStorageService.saveConfig).toHaveBeenCalledWith(
        'kitchen_config'
        expect.objectContaining(updates)
      );
      expect(mockSyncService.queueOperation).toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    it('should batch update order status', async () => {
      jest.spyOn(service, 'updateOrderStatus').mockResolvedValue();

      const orderIds = ['ORDER-1', 'ORDER-2', 'ORDER-3'];
      await service.batchUpdateOrderStatus(orderIds, OrderStatus.COMPLETED);

      expect(service.updateOrderStatus).toHaveBeenCalledTimes(3);
      orderIds.forEach(id => {
        expect(service.updateOrderStatus).toHaveBeenCalledWith(id, OrderStatus.COMPLETED);
      });
    });

    it('should batch delete orders', async () => {
      jest.spyOn(service, 'deleteOrder').mockResolvedValue();

      const orderIds = ['ORDER-1', 'ORDER-2'];
      await service.batchDeleteOrders(orderIds);

      expect(service.deleteOrder).toHaveBeenCalledTimes(2);
      orderIds.forEach(id => {
        expect(service.deleteOrder).toHaveBeenCalledWith(id);
      });
    });
  });

  describe('Data Export/Import', () => {
    it('should export data', async () => {
      const mockOrders = [mockOrder];
      const mockInventory = [];
      const mockConfig = { voiceControlEnabled: true };

      jest.spyOn(service, 'orders', 'get').mockReturnValue(
        new BehaviorSubject(mockOrders).asObservable()
      );
      jest.spyOn(service, 'inventory', 'get').mockReturnValue(
        new BehaviorSubject(mockInventory).asObservable()
      );
      jest.spyOn(service, 'config', 'get').mockReturnValue(
        new BehaviorSubject(mockConfig).asObservable()
      );

      const exportData = await service.exportData();

      expect(exportData.orders).toBe(mockOrders);
      expect(exportData.inventory).toBe(mockInventory);
      expect(exportData.config).toBe(mockConfig);
      expect(exportData.exportDate).toBeInstanceOf(Date);
    });

    it('should import data', async () => {
      const importData = {
        orders: [mockOrder]
        inventory: []
        config: { voiceControlEnabled: false }
      };

      await service.importData(importData);

      expect(mockStorageService.saveOrders).toHaveBeenCalledWith(importData.orders);
      expect(mockStorageService.saveConfig).toHaveBeenCalledWith('kitchen_config', importData.config);
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data when online', async () => {
      mockSyncService.isOnline = true;

      await service.refreshData();

      expect(mockSyncService.forcePullFromServer).toHaveBeenCalled();
    });

    it('should load from storage when offline', async () => {
      mockSyncService.isOnline = false;

      await service.refreshData();

      expect(mockStorageService.getOrders).toHaveBeenCalled();
      expect(mockStorageService.getInventory).toHaveBeenCalled();
    });
  });
});