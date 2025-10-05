import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/dashboard/admin-shell.component').then(
        c => c.AdminShellComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/admin-dashboard.component').then(
            c => c.AdminDashboardComponent
          ),
        title: 'Admin Dashboard - TableTap',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./components/orders/order-management.component').then(
            c => c.OrderManagementComponent
          ),
        title: 'Order Management - TableTap',
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./components/inventory/inventory-management.component').then(
            c => c.InventoryManagementComponent
          ),
        title: 'Inventory Management - TableTap',
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./components/employees/employee-management.component').then(
            c => c.EmployeeManagementComponent
          ),
        title: 'Employee Management - TableTap',
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./components/analytics/analytics-dashboard.component').then(
            c => c.AnalyticsDashboardComponent
          ),
        title: 'Analytics - TableTap',
      }
    ],
  }
];
