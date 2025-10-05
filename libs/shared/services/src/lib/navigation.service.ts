import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
// import { AuthService } from '@app/frontend-modules-auth/service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  children?: NavigationItem[];
  badge?: string;
  exact?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private readonly router = inject(Router);
  // private readonly authService = inject(AuthService);

  private readonly _breadcrumbs = new BehaviorSubject<BreadcrumbItem[]>([]);
  private readonly _currentRoute = new BehaviorSubject<string>('');

  readonly breadcrumbs$ = this._breadcrumbs.asObservable();
  readonly currentRoute$ = this._currentRoute.asObservable();

  private readonly navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'pi pi-home',
      route: '/',
      exact: true,
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: 'pi pi-book',
      route: '/menu',
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: 'pi pi-shopping-cart',
      route: '/cart',
    },
    {
      id: 'orders',
      label: 'My Orders',
      icon: 'pi pi-list',
      route: '/order',
      roles: ['customer'],
    },
    {
      id: 'kitchen',
      label: 'Kitchen',
      icon: 'pi pi-tablet',
      route: '/kitchen',
      roles: ['kitchen_staff', 'admin'],
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: 'pi pi-cog',
      route: '/admin',
      roles: ['admin'],
      children: [
        {
          id: 'admin-dashboard',
          label: 'Dashboard',
          icon: 'pi pi-chart-line',
          route: '/admin/dashboard',
        },
        {
          id: 'admin-orders',
          label: 'Order Management',
          icon: 'pi pi-list',
          route: '/admin/orders',
        },
        {
          id: 'admin-inventory',
          label: 'Inventory',
          icon: 'pi pi-box',
          route: '/admin/inventory',
        },
        {
          id: 'admin-employees',
          label: 'Employees',
          icon: 'pi pi-users',
          route: '/admin/employees',
        },
        {
          id: 'admin-analytics',
          label: 'Analytics',
          icon: 'pi pi-chart-bar',
          route: '/admin/analytics',
        },
      ],
    },
  ];
  readonly visibleNavigation$ = new BehaviorSubject<NavigationItem[]>(this.filterNavigationByRole(this.navigationItems, undefined, false)).asObservable();

  constructor() {
    // Track current route for breadcrumbs and active navigation
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      this._currentRoute.next(event.url);
      this.updateBreadcrumbs(event.url);
    });
  }

  private filterNavigationByRole(items: NavigationItem[], userRole?: string, isAuthenticated?: boolean): NavigationItem[] {
    return items
      .filter((item) => {
        // If no roles specified, show to everyone
        if (!item.roles || item.roles.length === 0) {
          return true;
        }

        // If roles specified but user not authenticated, hide
        if (!isAuthenticated) {
          return false;
        }

        // Check if user role matches required roles
        return userRole && item.roles.includes(userRole);
      })
      .map((item) => ({
        ...item,
        children: item.children ? this.filterNavigationByRole(item.children, userRole, isAuthenticated) : undefined,
      }));
  }

  private updateBreadcrumbs(url: string): void {
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', route: '/' }];
    const segments = url.split('/').filter((segment) => segment);
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Find navigation item for this path
      const navItem = this.findNavigationItem(currentPath, this.navigationItems);

      if (navItem) {
        breadcrumbs.push({
          label: navItem.label,
          route: index === segments.length - 1 ? undefined : currentPath,
        });
      } else {
        // Fallback for dynamic routes
        breadcrumbs.push({
          label: this.formatSegmentLabel(segment),
          route: index === segments.length - 1 ? undefined : currentPath,
        });
      }
    });

    this._breadcrumbs.next(breadcrumbs);
  }

  private findNavigationItem(path: string, items: NavigationItem[]): NavigationItem | null {
    for (const item of items) {
      if (item.route === path) {
        return item;
      }
      if (item.children) {
        const found = this.findNavigationItem(path, item.children);
        if (found) return found;
      }
    }
    return null;
  }

  private formatSegmentLabel(segment: string): string {
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void {
    this._breadcrumbs.next(breadcrumbs);
  }

  isRouteActive(route: string, exact = false): boolean {
    const currentRoute = this._currentRoute.value;
    return exact ? currentRoute === route : currentRoute.startsWith(route);
  }
}
