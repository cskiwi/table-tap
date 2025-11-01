import { DataSource } from 'typeorm';
import dataSource from './datasource';
import {
  User,
  Cafe,
  Product,
  Order,
  OrderItem,
  Stock,
  Employee,
  InventoryAlert,
  AdminNotification,
  AdminSettings,
  SalesAnalytics,
} from '@app/models';
import {
  UserRole,
  UserStatus,
  OrderStatus,
  PaymentStatus,
  AlertSeverity,
  AlertType,
} from '@app/models/enums';

// NotificationType and NotificationSeverity are defined locally in the AdminNotification model
enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  ORDER_ALERT = 'ORDER_ALERT',
  EMPLOYEE_ALERT = 'EMPLOYEE_ALERT',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  REVENUE_MILESTONE = 'REVENUE_MILESTONE',
  REPORT_READY = 'REPORT_READY',
  INVENTORY_ALERT = 'INVENTORY_ALERT',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  QUALITY_ALERT = 'QUALITY_ALERT',
}

enum NotificationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Comprehensive seed data for TableTap development and testing
 *
 * This script creates realistic sample data including:
 * - 1 cafe with complete settings
 * - 5 users (admin, manager, employees, customer)
 * - 12 products (coffee, food, beverages)
 * - 12 stock items with realistic inventory levels
 * - 15 orders with various statuses
 * - 3 employees with performance data
 * - 8 inventory alerts (low stock, expiring items)
 * - 10 admin notifications
 * - Admin settings configuration
 * - Sales analytics data
 */

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Clear existing data (in correct order to respect foreign keys)
    console.log('\n🗑️  Clearing existing data...');
    await dataSource.query('TRUNCATE TABLE "SalesAnalytics" CASCADE');
    await dataSource.query('TRUNCATE TABLE "AdminSettings" CASCADE');
    await dataSource.query('TRUNCATE TABLE "AdminNotifications" CASCADE');
    await dataSource.query('TRUNCATE TABLE "InventoryAlerts" CASCADE');
    await dataSource.query('TRUNCATE TABLE "Employees" CASCADE');
    await dataSource.query('TRUNCATE TABLE "OrderItems" CASCADE');
    await dataSource.query('TRUNCATE TABLE "Orders" CASCADE');
    await dataSource.query('TRUNCATE TABLE "Stocks" CASCADE');
    await dataSource.query('TRUNCATE TABLE "Products" CASCADE');
    await dataSource.query('TRUNCATE TABLE "Users" CASCADE');
    await dataSource.query('TRUNCATE TABLE "Cafes" CASCADE');
    console.log('✅ Existing data cleared');

    // 1. CREATE CAFE
    console.log('\n☕ Creating cafe...');
    const cafe = await dataSource.getRepository(Cafe).save({
      name: 'TableTap Downtown',
      slug: 'tabletap-downtown',
      email: 'info@tabletap-downtown.com',
      phoneNumber: '+1-555-123-4567',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'USA',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      isActive: true,
    } as any);
    console.log(`✅ Created cafe: ${cafe.name} (ID: ${cafe.id})`);

    // 2. CREATE USERS
    console.log('\n👤 Creating users...');
    const adminUser = await dataSource.getRepository(User).save({
      cafeId: cafe.id,
      firstName: 'John',
      lastName: 'Admin',
      fullName: 'John Admin',
      email: 'admin@tabletap.com',
      phoneNumber: '+1-555-100-0001',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      permissions: ['*'],
    });

    const managerUser = await dataSource.getRepository(User).save({
      cafeId: cafe.id,
      firstName: 'Sarah',
      lastName: 'Johnson',
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@tabletap.com',
      phoneNumber: '+1-555-100-0002',
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
      permissions: ['orders.*', 'inventory.*', 'employees.view'],
    });

    const employeeUser1 = await dataSource.getRepository(User).save({
      cafeId: cafe.id,
      firstName: 'Mike',
      lastName: 'Chen',
      fullName: 'Mike Chen',
      email: 'mike.chen@tabletap.com',
      phoneNumber: '+1-555-100-0003',
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      permissions: ['orders.view', 'orders.create'],
    });

    const employeeUser2 = await dataSource.getRepository(User).save({
      cafeId: cafe.id,
      firstName: 'Emma',
      lastName: 'Williams',
      fullName: 'Emma Williams',
      email: 'emma.williams@tabletap.com',
      phoneNumber: '+1-555-100-0004',
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      permissions: ['orders.view', 'orders.create'],
    });

    const customerUser = await dataSource.getRepository(User).save({
      cafeId: cafe.id,
      firstName: 'Jane',
      lastName: 'Customer',
      fullName: 'Jane Customer',
      email: 'jane.customer@example.com',
      phoneNumber: '+1-555-200-0001',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      permissions: [],
    });

    console.log(`✅ Created ${5} users (Admin, Manager, 2 Employees, Customer)`);

    // 3. CREATE PRODUCTS
    console.log('\n🍽️  Creating products...');
    const products = await dataSource.getRepository(Product).save([
      {
        cafeId: cafe.id,
        name: 'Cappuccino',
        description: 'Classic Italian coffee with steamed milk foam',
        category: 'Coffee',
        price: 4.50,
        costPrice: 1.20,
        sku: 'COFFEE-CAP-001',
        isAvailable: true,
        preparationTime: 5,
        calories: 120,
        ingredients: ['Espresso', 'Steamed Milk', 'Milk Foam'],
      },
      {
        cafeId: cafe.id,
        name: 'Latte',
        description: 'Smooth espresso with steamed milk',
        category: 'Coffee',
        price: 4.75,
        costPrice: 1.30,
        sku: 'COFFEE-LAT-001',
        isAvailable: true,
        preparationTime: 5,
        calories: 150,
        ingredients: ['Espresso', 'Steamed Milk'],
      },
      {
        cafeId: cafe.id,
        name: 'Americano',
        description: 'Espresso diluted with hot water',
        category: 'Coffee',
        price: 3.50,
        costPrice: 0.90,
        sku: 'COFFEE-AME-001',
        isAvailable: true,
        preparationTime: 3,
        calories: 15,
        ingredients: ['Espresso', 'Hot Water'],
      },
      {
        cafeId: cafe.id,
        name: 'Espresso',
        description: 'Strong, concentrated coffee shot',
        category: 'Coffee',
        price: 2.75,
        costPrice: 0.70,
        sku: 'COFFEE-ESP-001',
        isAvailable: true,
        preparationTime: 2,
        calories: 3,
        ingredients: ['Coffee Beans'],
      },
      {
        cafeId: cafe.id,
        name: 'Mocha',
        description: 'Chocolate flavored variant of a latte',
        category: 'Coffee',
        price: 5.25,
        costPrice: 1.50,
        sku: 'COFFEE-MOC-001',
        isAvailable: true,
        preparationTime: 6,
        calories: 290,
        ingredients: ['Espresso', 'Steamed Milk', 'Chocolate Syrup', 'Whipped Cream'],
      },
      {
        cafeId: cafe.id,
        name: 'Croissant',
        description: 'Buttery, flaky French pastry',
        category: 'Pastries',
        price: 3.50,
        costPrice: 1.10,
        sku: 'FOOD-CRO-001',
        isAvailable: true,
        preparationTime: 2,
        calories: 231,
        ingredients: ['Flour', 'Butter', 'Yeast', 'Sugar'],
      },
      {
        cafeId: cafe.id,
        name: 'Blueberry Muffin',
        description: 'Freshly baked muffin with blueberries',
        category: 'Pastries',
        price: 3.75,
        costPrice: 1.00,
        sku: 'FOOD-MUF-001',
        isAvailable: true,
        preparationTime: 2,
        calories: 426,
        ingredients: ['Flour', 'Blueberries', 'Sugar', 'Eggs', 'Butter'],
      },
      {
        cafeId: cafe.id,
        name: 'Avocado Toast',
        description: 'Toasted bread with mashed avocado',
        category: 'Food',
        price: 8.50,
        costPrice: 2.50,
        sku: 'FOOD-AVO-001',
        isAvailable: true,
        preparationTime: 10,
        calories: 350,
        ingredients: ['Sourdough Bread', 'Avocado', 'Lemon', 'Salt', 'Pepper'],
      },
      {
        cafeId: cafe.id,
        name: 'Orange Juice',
        description: 'Freshly squeezed orange juice',
        category: 'Beverages',
        price: 4.25,
        costPrice: 1.50,
        sku: 'BEV-OJ-001',
        isAvailable: true,
        preparationTime: 3,
        calories: 110,
        ingredients: ['Fresh Oranges'],
      },
      {
        cafeId: cafe.id,
        name: 'Green Tea',
        description: 'Traditional Japanese green tea',
        category: 'Tea',
        price: 3.25,
        costPrice: 0.80,
        sku: 'TEA-GRE-001',
        isAvailable: true,
        preparationTime: 4,
        calories: 2,
        ingredients: ['Green Tea Leaves', 'Hot Water'],
      },
      {
        cafeId: cafe.id,
        name: 'Iced Coffee',
        description: 'Cold brewed coffee served over ice',
        category: 'Coffee',
        price: 4.00,
        costPrice: 1.00,
        sku: 'COFFEE-ICE-001',
        isAvailable: true,
        preparationTime: 3,
        calories: 5,
        ingredients: ['Cold Brew Coffee', 'Ice'],
      },
      {
        cafeId: cafe.id,
        name: 'Bagel with Cream Cheese',
        description: 'Fresh bagel with cream cheese spread',
        category: 'Food',
        price: 4.50,
        costPrice: 1.30,
        sku: 'FOOD-BAG-001',
        isAvailable: true,
        preparationTime: 5,
        calories: 340,
        ingredients: ['Bagel', 'Cream Cheese'],
      },
    ] as any);
    console.log(`✅ Created ${products.length} products`);

    // 4. CREATE STOCK ITEMS
    console.log('\n📦 Creating stock items...');
    const stocks = [];
    for (const product of products) {
      // Create realistic stock levels
      let quantity: number;
      let minimumStock: number;

      if (product.category === 'Coffee') {
        quantity = Math.floor(Math.random() * 50) + 10; // 10-60 units
        minimumStock = 15;
      } else if (product.category === 'Pastries' || product.category === 'Food') {
        quantity = Math.floor(Math.random() * 30) + 5; // 5-35 units
        minimumStock = 10;
      } else {
        quantity = Math.floor(Math.random() * 40) + 10; // 10-50 units
        minimumStock = 12;
      }

      const stock = await dataSource.getRepository(Stock).save({
        cafeId: cafe.id,
        productId: product.id,
        quantity,
        minimumStock,
        maximumStock: minimumStock * 4,
        unitCost: product.costPrice,
        unit: 'units',
        supplier: product.category === 'Coffee' ? 'Premium Coffee Co.' : 'Local Supplier Inc.',
        lastRestocked: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
      });
      stocks.push(stock);
    }
    console.log(`✅ Created ${stocks.length} stock items`);

    // 5. CREATE ORDERS
    console.log('\n📋 Creating orders...');
    const orderStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];

    const orderTypes = ['DINE_IN', 'TAKEAWAY'];
    const orders = [];

    for (let i = 0; i < 15; i++) {
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
      const createdHoursAgo = Math.random() * 72; // Last 3 days

      const order = await dataSource.getRepository(Order).save({
        cafeId: cafe.id,
        orderNumber: `ORD-${String(1000 + i).padStart(4, '0')}`,
        status,
        customerId: Math.random() > 0.3 ? customerUser.id : undefined,
        customerName: Math.random() > 0.3 ? customerUser.fullName : `Guest ${i + 1}`,
        customerEmail: Math.random() > 0.5 ? customerUser.email : undefined,
        orderType: orderType as any,
        tableNumber: orderType === 'DINE_IN' ? `T${Math.floor(Math.random() * 20) + 1}` : undefined,
        paymentStatus: status === OrderStatus.DELIVERED ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
        paymentMethod: status === OrderStatus.DELIVERED ? 'Credit Card' : undefined,
        specialInstructions: Math.random() > 0.7 ? 'Extra hot please' : undefined,
        createdAt: new Date(Date.now() - createdHoursAgo * 60 * 60 * 1000),
      });
      orders.push(order);
    }
    console.log(`✅ Created ${orders.length} orders`);

    // 6. CREATE ORDER ITEMS
    console.log('\n🛒 Creating order items...');
    let totalOrderItems = 0;

    for (const order of orders) {
      const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      let orderTotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
        const totalPrice = product.price * quantity;
        orderTotal += totalPrice;

        await dataSource.getRepository(OrderItem).save({
          orderId: order.id,
          cafeId: cafe.id,
          menuItemId: product.id,
          menuItemName: product.name,
          quantity,
          unitPrice: product.price,
          totalPrice,
          status: order.status,
          specialInstructions: Math.random() > 0.8 ? 'No sugar' : undefined,
        });
        totalOrderItems++;
      }

      // Update order total
      await dataSource.getRepository(Order).update(order.id, {
        subtotal: orderTotal,
        taxAmount: orderTotal * 0.0875, // 8.75% tax
        totalAmount: orderTotal * 1.0875,
      });
    }
    console.log(`✅ Created ${totalOrderItems} order items across ${orders.length} orders`);

    // 7. CREATE EMPLOYEES
    console.log('\n👥 Creating employees...');
    const employees = await dataSource.getRepository(Employee).save([
      {
        cafeId: cafe.id,
        userId: managerUser.id,
        firstName: managerUser.firstName,
        lastName: managerUser.lastName,
        email: managerUser.email,
        phoneNumber: managerUser.phoneNumber,
        position: 'Manager',
        employeeNumber: 'EMP-001',
        hourlyRate: 25.00,
        status: 'ACTIVE',
        hireDate: new Date('2023-01-15'),
        department: 'Management',
      },
      {
        cafeId: cafe.id,
        userId: employeeUser1.id,
        firstName: employeeUser1.firstName,
        lastName: employeeUser1.lastName,
        email: employeeUser1.email,
        phoneNumber: employeeUser1.phoneNumber,
        position: 'Barista',
        employeeNumber: 'EMP-002',
        hourlyRate: 18.00,
        status: 'ACTIVE',
        hireDate: new Date('2023-03-20'),
        department: 'Service',
      },
      {
        cafeId: cafe.id,
        userId: employeeUser2.id,
        firstName: employeeUser2.firstName,
        lastName: employeeUser2.lastName,
        email: employeeUser2.email,
        phoneNumber: employeeUser2.phoneNumber,
        position: 'Cashier',
        employeeNumber: 'EMP-003',
        hourlyRate: 16.00,
        status: 'ACTIVE',
        hireDate: new Date('2023-06-10'),
        department: 'Service',
      },
    ] as any);
    console.log(`✅ Created ${employees.length} employees`);

    // 8. CREATE INVENTORY ALERTS
    console.log('\n⚠️  Creating inventory alerts...');
    // Find low stock items
    const lowStockItems = stocks.filter(s => s.quantity <= s.minimumStock);
    const alerts = [];

    for (const stock of lowStockItems.slice(0, 5)) {
      const product = products.find((p: any) => p.id === stock.productId);
      const alert = await dataSource.getRepository(InventoryAlert).save({
        cafeId: cafe.id,
        stockId: stock.id,
        type: stock.quantity === 0 ? AlertType.OUT_OF_STOCK : AlertType.LOW_STOCK,
        severity: stock.quantity === 0 ? AlertSeverity.HIGH : AlertSeverity.HIGH,
        title: stock.quantity === 0 ? `Out of Stock: ${product.name}` : `Low Stock: ${product.name}`,
        message: stock.quantity === 0
          ? `${product.name} is completely out of stock. Immediate reorder required.`
          : `${product.name} stock is below minimum level. Current: ${stock.quantity}, Minimum: ${stock.minimumStock}`,
        currentStock: stock.quantity,
        minimumStock: stock.minimumStock,
        reorderLevel: stock.minimumStock * 2,
        itemName: product.name,
        sku: product.sku,
        category: product.category,
        resolved: false,
        acknowledged: Math.random() > 0.5,
        actionUrl: `/admin/inventory/${stock.id}`,
        actionLabel: 'Reorder Now',
      } as any);
      alerts.push(alert);
    }

    // Add expiring items
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + 3); // Expires in 3 days

    const perishableStock = stocks.find(s => products.find((p: any) => p.id === s.productId && p.category === 'Pastries'));
    if (perishableStock) {
      const product = products.find((p: any) => p.id === perishableStock.productId);
      alerts.push(await dataSource.getRepository(InventoryAlert).save({
        cafeId: cafe.id,
        stockId: perishableStock.id,
        type: AlertType.EXPIRED,
        severity: AlertSeverity.HIGH,
        title: `Expiring Soon: ${product.name}`,
        message: `${product.name} will expire in 3 days. Consider promotional pricing.`,
        currentStock: perishableStock.quantity,
        minimumStock: perishableStock.minimumStock,
        expiryDate: expiringDate,
        itemName: product.name,
        sku: product.sku,
        category: product.category,
        resolved: false,
        acknowledged: false,
        actionUrl: `/admin/inventory/${perishableStock.id}`,
        actionLabel: 'View Details',
      } as any));
    }

    console.log(`✅ Created ${alerts.length} inventory alerts`);

    // 9. CREATE ADMIN NOTIFICATIONS
    console.log('\n🔔 Creating admin notifications...');
    const notifications = await dataSource.getRepository(AdminNotification).save([
      {
        cafeId: cafe.id,
        userId: adminUser.id,
        type: NotificationType.ORDER_ALERT,
        severity: NotificationSeverity.WARNING,
        title: 'Multiple Pending Orders',
        message: 'You have 5 orders waiting for preparation',
        actionUrl: '/admin/orders?status=pending',
        actionLabel: 'View Orders',
        isRead: false,
      },
      {
        cafeId: cafe.id,
        userId: adminUser.id,
        type: NotificationType.INVENTORY_ALERT,
        severity: NotificationSeverity.CRITICAL,
        title: 'Critical Stock Levels',
        message: 'Multiple items are below minimum stock levels',
        actionUrl: '/admin/inventory?filter=low-stock',
        actionLabel: 'Check Inventory',
        isRead: false,
      },
      {
        cafeId: cafe.id,
        userId: adminUser.id,
        type: NotificationType.REVENUE_MILESTONE,
        severity: NotificationSeverity.INFO,
        title: 'Daily Revenue Target Achieved',
        message: 'Congratulations! Today\'s revenue has exceeded $1,000',
        actionUrl: '/admin/analytics',
        actionLabel: 'View Analytics',
        isRead: true,
      },
      {
        cafeId: cafe.id,
        userId: managerUser.id,
        type: NotificationType.EMPLOYEE_ALERT,
        severity: NotificationSeverity.INFO,
        title: 'Shift Coverage Needed',
        message: 'Tomorrow evening shift needs additional coverage',
        actionUrl: '/admin/employees/schedule',
        actionLabel: 'Manage Schedule',
        isRead: false,
      },
      {
        cafeId: cafe.id,
        userId: adminUser.id,
        type: NotificationType.SYSTEM_ALERT,
        severity: NotificationSeverity.INFO,
        title: 'System Maintenance Scheduled',
        message: 'Routine system maintenance scheduled for Sunday 2:00 AM',
        actionUrl: '/admin/settings/system',
        actionLabel: 'View Details',
        isRead: true,
      },
      {
        cafeId: cafe.id,
        userId: adminUser.id,
        type: NotificationType.PAYMENT_ISSUE,
        severity: NotificationSeverity.ERROR,
        title: 'Payment Gateway Issue',
        message: '2 failed payment transactions detected',
        actionUrl: '/admin/orders?payment=failed',
        actionLabel: 'Review Transactions',
        isRead: false,
      },
      {
        cafeId: cafe.id,
        userId: managerUser.id,
        type: NotificationType.LOW_STOCK,
        severity: NotificationSeverity.WARNING,
        title: 'Coffee Beans Running Low',
        message: 'Colombian Coffee Beans stock is at 15% capacity',
        actionUrl: '/admin/inventory',
        actionLabel: 'Reorder',
        isRead: false,
      },
      {
        cafeId: cafe.id,
        userId: adminUser.id,
        type: NotificationType.QUALITY_ALERT,
        severity: NotificationSeverity.WARNING,
        title: 'Customer Feedback Alert',
        message: 'Recent decrease in average customer ratings (4.2/5.0)',
        actionUrl: '/admin/feedback',
        actionLabel: 'View Feedback',
        isRead: true,
      },
    ]);
    console.log(`✅ Created ${notifications.length} admin notifications`);

    // 10. CREATE ADMIN SETTINGS
    console.log('\n⚙️  Creating admin settings...');
    const settings = await dataSource.getRepository(AdminSettings).save({
      cafeId: cafe.id,
      lowStockThreshold: 15,
      criticalStockThreshold: 5,
      autoReorderEnabled: true,
      reorderQuantityMultiplier: 2.0,
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      enablePushNotifications: true,
      notificationPreferences: {
        email: ['admin@tabletap.com', 'manager@tabletap.com'],
        orderAlerts: true,
        inventoryAlerts: true,
        employeeAlerts: true,
        revenueReports: true,
      },
      businessMetrics: {
        dailyRevenueTarget: 1000,
        weeklyRevenueTarget: 7000,
        monthlyRevenueTarget: 30000,
        averageOrderValue: 15.50,
        customerRetentionRate: 0.68,
      },
      integrations: {
        paymentGateway: 'stripe',
        emailService: 'sendgrid',
        smsService: 'twilio',
        analyticsService: 'google-analytics',
      },
    });
    console.log(`✅ Created admin settings for cafe`);

    // 11. CREATE SALES ANALYTICS
    console.log('\n📊 Creating sales analytics...');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Calculate actual metrics from orders
    const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const todayOrders = completedOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= startOfDay && orderDate <= endOfDay;
    });

    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Calculate top products
    const productSales = new Map<string, { productId: string; productName: string; quantity: number; revenue: number }>();

    const allOrderItems = await dataSource.getRepository(OrderItem).find();

    for (const item of allOrderItems) {
      const existing = productSales.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.totalPrice;
      } else {
        productSales.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          revenue: item.totalPrice,
        });
      }
    }

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const analytics = await dataSource.getRepository(SalesAnalytics).save({
      cafeId: cafe.id,
      period: 'daily',
      startDate: startOfDay,
      endDate: endOfDay,
      totalRevenue,
      orderCount: completedOrders.length,
      averageOrderValue,
      topProducts,
      revenueGrowth: 12.5, // Mock growth percentage
      orderGrowth: 8.3,
      peakHours: [
        { hour: 8, orders: 15, revenue: 225 },
        { hour: 12, orders: 25, revenue: 425 },
        { hour: 17, orders: 20, revenue: 380 },
      ],
      categoryBreakdown: {
        Coffee: { orders: 45, revenue: 210.50 },
        Pastries: { orders: 22, revenue: 82.50 },
        Food: { orders: 18, revenue: 175.00 },
        Beverages: { orders: 12, revenue: 51.00 },
      },
    } as any);
    console.log(`✅ Created sales analytics record`);

    // SUMMARY
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   ☕ Cafes: 1`);
    console.log(`   👤 Users: 5 (1 Admin, 1 Manager, 2 Employees, 1 Customer)`);
    console.log(`   🍽️  Products: ${products.length}`);
    console.log(`   📦 Stock Items: ${stocks.length}`);
    console.log(`   📋 Orders: ${orders.length}`);
    console.log(`   🛒 Order Items: ${totalOrderItems}`);
    console.log(`   👥 Employees: ${employees.length}`);
    console.log(`   ⚠️  Inventory Alerts: ${alerts.length}`);
    console.log(`   🔔 Admin Notifications: ${notifications.length}`);
    console.log(`   ⚙️  Admin Settings: 1`);
    console.log(`   📊 Sales Analytics: 1`);
    console.log('\n📝 Test Credentials:');
    console.log(`   Admin: admin@tabletap.com`);
    console.log(`   Manager: sarah.johnson@tabletap.com`);
    console.log(`   Employee: mike.chen@tabletap.com`);
    console.log(`   Cafe ID: ${cafe.id}`);
    console.log('\n🚀 Your database is now ready for development and testing!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('✅ Database connection closed');
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('\n✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });
