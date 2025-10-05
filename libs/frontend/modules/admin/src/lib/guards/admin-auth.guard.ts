import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { AdminPermission } from '../types/admin.types';

export const adminAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const adminService = inject(AdminService);

  // Check if user is authenticated and has admin permissions
  // This is a simplified implementation - replace with actual auth service
  const isAuthenticated = true; // Replace with actual auth check
  const userPermissions: AdminPermission[] = ['VIEW_DASHBOARD', 'MANAGE_ORDERS', 'MANAGE_INVENTORY']; // Replace with actual permissions

  if (!isAuthenticated) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Check for required permissions based on route
  const requiredPermission = getRequiredPermission(state.url);
  if (requiredPermission && !userPermissions.includes(requiredPermission)) {
    router.navigate(['/admin/dashboard']); // Redirect to dashboard if no permission
    return false;
  }

  return true;
}

function getRequiredPermission(url: string): AdminPermission | null {
  if (url.includes('/admin/orders')) return 'MANAGE_ORDERS';
  if (url.includes('/admin/inventory')) return 'MANAGE_INVENTORY';
  if (url.includes('/admin/employees')) return 'MANAGE_EMPLOYEES';
  if (url.includes('/admin/analytics')) return 'VIEW_ANALYTICS';
  if (url.includes('/admin/settings')) return 'MANAGE_SETTINGS';
  if (url.includes('/admin/dashboard')) return 'VIEW_DASHBOARD';

  return null;
}