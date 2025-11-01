import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG imports
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenubarModule } from 'primeng/menubar';
import { PopoverModule } from 'primeng/popover';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuItem } from 'primeng/api';

import { AdminService } from '../../services/admin.service';
import { AdminNavigationItem, AdminNotification } from '../../types/admin.types';

@Component({
  selector: 'tt-admin-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DrawerModule,
    MenuModule,
    ButtonModule,
    ToolbarModule,
    AvatarModule,
    BadgeModule,
    MenubarModule,
    PopoverModule,
    CardModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './admin-shell.component.html',
})
export class AdminShellComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private router = inject(Router);

  // Reactive state
  sidebarVisible = signal(true);

  // Computed values from service
  notifications = this.adminService.notifications;
  unreadNotificationsCount = this.adminService.unreadNotifications;
  criticalAlertsCount = this.adminService.criticalAlerts;

  // User and cafe data from AdminService
  // In production, this would come from AuthService and CafeService
  currentUser = computed(() => ({
    id: this.adminService.selectedCafeId() || '1',
    name: 'Admin User', // TODO: Get from AuthService
    email: 'admin@tabletap.com',
    role: 'Restaurant Manager',
    permissions: [] as string[],
    cafeId: this.adminService.selectedCafeId() || '',
    profileImage: undefined as string | undefined
  }));

  currentCafe = computed(() => ({
    id: this.adminService.selectedCafeId() || '',
    name: 'TableTap Downtown', // TODO: Fetch from CafeService
  }));

  // Navigation items with badges from service
  navigationItems = computed((): AdminNavigationItem[] => [
    {
      label: 'Dashboard',
      icon: 'pi-home',
      route: '/admin/dashboard',
    },
    {
      label: 'Orders',
      icon: 'pi-shopping-cart',
      route: '/admin/orders',
      badge: this.adminService.orderMetrics()?.pending || 0
    },
    {
      label: 'Inventory',
      icon: 'pi-box',
      route: '/admin/inventory',
      badge: this.criticalAlertsCount()
    },
    {
      label: 'Employees',
      icon: 'pi-users',
      route: '/admin/employees'
    },
    {
      label: 'Analytics',
      icon: 'pi-chart-line',
      route: '/admin/analytics',
      children: [
        {
          label: 'Sales Report',
          icon: 'pi-chart-bar',
          route: '/admin/analytics/sales'
        },
        {
          label: 'Performance',
          icon: 'pi-chart-pie',
          route: '/admin/analytics/performance'
        },
        {
          label: 'Inventory Report',
          icon: 'pi-list',
          route: '/admin/analytics/inventory'
        }
      ]
    },
    {
      label: 'Customers',
      icon: 'pi-user-plus',
      route: '/admin/customers'
    },
    {
      label: 'Settings',
      icon: 'pi-cog',
      route: '/admin/settings',
      children: [
        {
          label: 'General',
          icon: 'pi-sliders-h',
          route: '/admin/settings/general'
        },
        {
          label: 'Operations',
          icon: 'pi-clock',
          route: '/admin/settings/operations'
        },
        {
          label: 'Integrations',
          icon: 'pi-link',
          route: '/admin/settings/integrations'
        }
      ]
    }
  ]);

  ngOnInit(): void {
    // Initialize admin dashboard
    const cafeId = this.currentCafe().id;
    this.adminService.initializeDashboard(cafeId);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  toggleSidebar(): void {
    this.sidebarVisible.update(visible => !visible);
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  navigateToRoute(route: string): void {
    this.router.navigate([route]);
  }

  navigateToNotificationAction(notification: AdminNotification): void {
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
      this.markNotificationRead(notification.id);
    }
  }

  markNotificationRead(notificationId: string): void {
    this.adminService.markNotificationAsRead(notificationId);
  }

  markAllNotificationsRead(): void {
    this.adminService.markAllNotificationsAsRead()
  }

  refreshData(): void {
    this.adminService.refreshData()
  }

  navigateToProfile(): void {
    this.router.navigate(['/admin/profile']);
  }

  navigateToPreferences(): void {
    this.router.navigate(['/admin/preferences']);
  }

  openHelp(): void {
    // Open help documentation or support chat
    window.open('/help', '_blank');
  }

  logout(): void {
    // Implement logout logic
    this.router.navigate(['/auth/login']);
  }
}