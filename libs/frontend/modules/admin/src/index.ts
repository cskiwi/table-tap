// Routes
export { adminRoutes } from './lib/admin.routes';

// Main admin module exports
export * from './lib/services/admin.service';
export * from './lib/types/admin.types';

// Dashboard components
export * from './lib/components/dashboard/admin-shell.component';
export * from './lib/components/dashboard/admin-dashboard.component';

// Order management
export * from './lib/components/orders/order-management.component';

// Inventory management
export * from './lib/components/inventory/inventory-management.component';

// Re-export for barrel imports
export { AdminService } from './lib/services/admin.service';
export { AdminShellComponent } from './lib/components/dashboard/admin-shell.component';
export { AdminDashboardComponent } from './lib/components/dashboard/admin-dashboard.component';
export { OrderManagementComponent } from './lib/components/orders/order-management.component';
export { InventoryManagementComponent } from './lib/components/inventory/inventory-management.component';