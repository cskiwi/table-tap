# TableTap Routing Structure Design

## Overview

This document outlines the comprehensive routing structure for the TableTap restaurant management application, including role-based access control, lazy loading strategies, and navigation patterns.

## 1. Application Routing Hierarchy

```
/
├── auth/
│   ├── login
│   ├── register
│   ├── forgot-password
│   └── callback
├── dashboard/
│   ├── overview
│   ├── analytics
│   └── notifications
├── menu/
│   ├── browse
│   ├── categories/:id
│   ├── items/:id
│   └── search
├── orders/
│   ├── checkout
│   ├── confirmation
│   ├── tracking/:id
│   └── receipt/:id
├── cart/
│   ├── view
│   ├── edit
│   └── saved
├── kitchen/
│   ├── queue
│   ├── active
│   ├── completed
│   ├── metrics
│   └── mobile/
│       ├── orders
│       └── timer
├── admin/
│   ├── dashboard
│   ├── orders/
│   │   ├── list
│   │   ├── details/:id
│   │   └── reports
│   ├── inventory/
│   │   ├── items
│   │   ├── categories
│   │   ├── suppliers
│   │   └── reports
│   ├── staff/
│   │   ├── list
│   │   ├── schedules
│   │   └── performance
│   └── settings/
│       ├── general
│       ├── payments
│       └── notifications
└── loyalty/
    ├── dashboard
    ├── challenges
    ├── rewards
    ├── tiers
    └── history
```

## 2. Route Configuration Implementation

### 2.1 Main Application Routes

```typescript
// apps/app/config/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '@app/frontend-modules-auth';
import { RoleGuard } from '@app/frontend-modules-auth';
import { AppShellComponent } from './components/app-shell/app-shell.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./pages/dashboard/dashboard.routes').then(r => r.dashboardRoutes),
        canActivate: [AuthGuard]
      },
      {
        path: 'menu',
        loadChildren: () => import('@app/frontend-modules-menu').then(m => m.menuRoutes),
        data: { preload: true }
      },
      {
        path: 'orders',
        loadChildren: () => import('@app/frontend-modules-order').then(m => m.orderRoutes),
        canActivate: [AuthGuard]
      },
      {
        path: 'cart',
        loadChildren: () => import('@app/frontend-modules-cart').then(m => m.cartRoutes)
      },
      {
        path: 'kitchen',
        loadChildren: () => import('@app/frontend-modules-kitchen').then(m => m.kitchenRoutes),
        canActivate: [AuthGuard, RoleGuard],
        data: {
          roles: ['staff', 'manager', 'admin'],
          preload: false
        }
      },
      {
        path: 'admin',
        loadChildren: () => import('@app/frontend-modules-admin').then(m => m.adminRoutes),
        canActivate: [AuthGuard, RoleGuard],
        data: {
          roles: ['manager', 'admin'],
          preload: false
        }
      },
      {
        path: 'loyalty',
        loadChildren: () => import('@app/frontend-modules-loyalty').then(m => m.loyaltyRoutes),
        canActivate: [AuthGuard],
        data: { preload: true }
      }
    ]
  },
  {
    path: 'auth',
    loadChildren: () => import('@app/frontend-modules-auth').then(m => m.authRoutes)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
```

### 2.2 Module-Specific Routes

#### Menu Module Routes
```typescript
// libs/frontend/modules/menu/src/lib/menu.routes.ts
export const menuRoutes: Routes = [
  {
    path: '',
    redirectTo: 'browse',
    pathMatch: 'full'
  },
  {
    path: 'browse',
    loadComponent: () => import('./components/menu-browse/menu-browse.component')
      .then(c => c.MenuBrowseComponent),
    title: 'Menu - TableTap'
  },
  {
    path: 'categories/:id',
    loadComponent: () => import('./components/category-view/category-view.component')
      .then(c => c.CategoryViewComponent),
    resolve: {
      category: CategoryResolver
    },
    title: 'Category - TableTap'
  },
  {
    path: 'items/:id',
    loadComponent: () => import('./components/menu-item-detail/menu-item-detail.component')
      .then(c => c.MenuItemDetailComponent),
    resolve: {
      item: MenuItemResolver
    },
    title: 'Menu Item - TableTap'
  },
  {
    path: 'search',
    loadComponent: () => import('./components/menu-search/menu-search.component')
      .then(c => c.MenuSearchComponent),
    title: 'Search Menu - TableTap'
  }
];
```

#### Kitchen Module Routes
```typescript
// libs/frontend/modules/kitchen/src/lib/kitchen.routes.ts
export const kitchenRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/kitchen-shell/kitchen-shell.component')
      .then(c => c.KitchenShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'queue',
        pathMatch: 'full'
      },
      {
        path: 'queue',
        loadComponent: () => import('./components/order-queue/order-queue.component')
          .then(c => c.OrderQueueComponent),
        title: 'Order Queue - Kitchen'
      },
      {
        path: 'active',
        loadComponent: () => import('./components/active-orders/active-orders.component')
          .then(c => c.ActiveOrdersComponent),
        title: 'Active Orders - Kitchen'
      },
      {
        path: 'completed',
        loadComponent: () => import('./components/completed-orders/completed-orders.component')
          .then(c => c.CompletedOrdersComponent),
        title: 'Completed Orders - Kitchen'
      },
      {
        path: 'metrics',
        loadComponent: () => import('./components/kitchen-metrics/kitchen-metrics.component')
          .then(c => c.KitchenMetricsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['manager', 'admin'] },
        title: 'Kitchen Metrics'
      }
    ]
  },
  {
    path: 'mobile',
    loadChildren: () => import('@app/frontend-modules-kitchen-mobile').then(m => m.kitchenMobileRoutes),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['staff', 'manager', 'admin'] }
  }
];
```

#### Admin Module Routes
```typescript
// libs/frontend/modules/admin/src/lib/admin.routes.ts
export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-shell/admin-shell.component')
      .then(c => c.AdminShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component')
          .then(c => c.AdminDashboardComponent),
        title: 'Admin Dashboard'
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/admin-orders.routes')
          .then(r => r.adminOrderRoutes)
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/admin-inventory.routes')
          .then(r => r.adminInventoryRoutes)
      },
      {
        path: 'staff',
        loadChildren: () => import('./features/staff/admin-staff.routes')
          .then(r => r.adminStaffRoutes),
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/admin-settings.routes')
          .then(r => r.adminSettingsRoutes),
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
      }
    ]
  }
];
```

## 3. Route Guards and Security

### 3.1 Authentication Guard
```typescript
// libs/frontend/modules/auth/src/lib/guards/auth.guard.ts
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      tap(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url }
          });
        }
      })
    );
  }
}
```

### 3.2 Role-Based Guard
```typescript
// libs/frontend/modules/auth/src/lib/guards/role.guard.ts
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[];

    return this.authService.user$.pipe(
      map(user => {
        if (!user) return false;

        const hasRequiredRole = this.permissionService.hasAnyRole(
          user.roles,
          requiredRoles
        );

        if (!hasRequiredRole) {
          this.router.navigate(['/dashboard']);
        }

        return hasRequiredRole;
      })
    );
  }
}
```

### 3.3 Feature Flag Guard
```typescript
// libs/frontend/modules/auth/src/lib/guards/feature-flag.guard.ts
@Injectable({ providedIn: 'root' })
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private featureFlagService: FeatureFlagService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const featureFlag = route.data['featureFlag'] as string;

    return this.featureFlagService.isEnabled(featureFlag).pipe(
      tap(isEnabled => {
        if (!isEnabled) {
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }
}
```

## 4. Route Resolvers

### 4.1 Menu Item Resolver
```typescript
// libs/frontend/modules/menu/src/lib/resolvers/menu-item.resolver.ts
@Injectable({ providedIn: 'root' })
export class MenuItemResolver implements Resolve<MenuItem> {
  constructor(private menuService: MenuService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<MenuItem> {
    const itemId = route.paramMap.get('id')!;

    return this.menuService.getMenuItem(itemId).pipe(
      catchError(error => {
        console.error('Failed to load menu item:', error);
        return of(null);
      })
    );
  }
}
```

### 4.2 Order Resolver
```typescript
// libs/frontend/modules/order/src/lib/resolvers/order.resolver.ts
@Injectable({ providedIn: 'root' })
export class OrderResolver implements Resolve<Order> {
  constructor(private orderService: OrderService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<Order> {
    const orderId = route.paramMap.get('id')!;

    return this.orderService.getOrder(orderId).pipe(
      catchError(error => {
        console.error('Failed to load order:', error);
        return EMPTY;
      })
    );
  }
}
```

## 5. Navigation Configuration

### 5.1 Role-Based Navigation Menu
```typescript
// src/app/components/navigation/navigation.config.ts
export interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  roles?: string[];
  children?: NavigationItem[];
}

export const navigationConfig: NavigationItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'dashboard'
  },
  {
    path: '/menu',
    label: 'Menu',
    icon: 'restaurant_menu'
  },
  {
    path: '/orders',
    label: 'Orders',
    icon: 'receipt',
    roles: ['customer', 'staff', 'manager', 'admin']
  },
  {
    path: '/kitchen',
    label: 'Kitchen',
    icon: 'kitchen',
    roles: ['staff', 'manager', 'admin'],
    children: [
      {
        path: '/kitchen/queue',
        label: 'Order Queue',
        icon: 'queue'
      },
      {
        path: '/kitchen/active',
        label: 'Active Orders',
        icon: 'pending_actions'
      },
      {
        path: '/kitchen/metrics',
        label: 'Metrics',
        icon: 'analytics',
        roles: ['manager', 'admin']
      }
    ]
  },
  {
    path: '/admin',
    label: 'Administration',
    icon: 'admin_panel_settings',
    roles: ['manager', 'admin'],
    children: [
      {
        path: '/admin/orders',
        label: 'Order Management',
        icon: 'manage_search'
      },
      {
        path: '/admin/inventory',
        label: 'Inventory',
        icon: 'inventory'
      },
      {
        path: '/admin/staff',
        label: 'Staff Management',
        icon: 'group',
        roles: ['admin']
      }
    ]
  },
  {
    path: '/loyalty',
    label: 'Rewards',
    icon: 'stars',
    roles: ['customer']
  }
];
```

### 5.2 Dynamic Navigation Service
```typescript
// src/app/services/navigation.service.ts
@Injectable({ providedIn: 'root' })
export class NavigationService {
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}

  getFilteredNavigation(): Observable<NavigationItem[]> {
    return this.authService.user$.pipe(
      map(user => {
        if (!user) return this.getPublicNavigation();

        return navigationConfig.filter(item =>
          this.hasPermissionForNavItem(item, user.roles)
        ).map(item => ({
          ...item,
          children: item.children?.filter(child =>
            this.hasPermissionForNavItem(child, user.roles)
          )
        }));
      })
    );
  }

  private hasPermissionForNavItem(item: NavigationItem, userRoles: string[]): boolean {
    if (!item.roles || item.roles.length === 0) return true;
    return this.permissionService.hasAnyRole(userRoles, item.roles);
  }

  private getPublicNavigation(): NavigationItem[] {
    return navigationConfig.filter(item => !item.roles || item.roles.length === 0);
  }
}
```

## 6. Route Preloading Strategy

### 6.1 Custom Preloading Strategy
```typescript
// src/app/strategies/selective-preloading.strategy.ts
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  private preloadedModules: string[] = [];

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (this.shouldPreload(route)) {
      console.log('Preloading: ' + route.path);
      this.preloadedModules.push(route.path || '');
      return load();
    }

    return of(null);
  }

  private shouldPreload(route: Route): boolean {
    // Preload if explicitly marked
    if (route.data && route.data['preload']) {
      return true;
    }

    // Don't preload admin/kitchen routes unless user has access
    if (route.path?.includes('admin') || route.path?.includes('kitchen')) {
      return false;
    }

    // Preload common user modules
    return ['menu', 'orders', 'loyalty'].some(module =>
      route.path?.includes(module)
    );
  }

  getPreloadedModules(): string[] {
    return [...this.preloadedModules];
  }
}
```

### 6.2 Network-Aware Preloading
```typescript
// src/app/strategies/network-aware-preloading.strategy.ts
@Injectable({ providedIn: 'root' })
export class NetworkAwarePreloadingStrategy implements PreloadingStrategy {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }

    // Check network conditions
    const connection = (navigator as any).connection;

    if (connection) {
      // Don't preload on slow connections
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return of(null);
      }

      // Don't preload when data saver is enabled
      if (connection.saveData) {
        return of(null);
      }
    }

    // Proceed with selective preloading
    return this.shouldPreload(route) ? load() : of(null);
  }

  private shouldPreload(route: Route): boolean {
    return route.data?.['preload'] === true;
  }
}
```

## 7. Route Animations

### 7.1 Route Transition Animations
```typescript
// src/app/animations/route-animations.ts
export const slideInAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ transform: 'translateX(100%)' })
    ], { optional: true }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(-100%)' }))
      ], { optional: true }),
      query(':enter', [
        animate('300ms ease-out', style({ transform: 'translateX(0%)' }))
      ], { optional: true })
    ]),
    query(':enter', animateChild(), { optional: true })
  ])
]);
```

## 8. URL Strategy and SEO

### 8.1 URL Configuration
```typescript
// apps/app/config/app.config.ts
import { LocationStrategy, PathLocationStrategy } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    // Use PathLocationStrategy for clean URLs
    { provide: LocationStrategy, useClass: PathLocationStrategy },

    // Router configuration with SEO-friendly URLs
    provideRouter(appRoutes,
      withViewTransitions(),
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      })
    )
  ]
};
```

### 8.2 Meta Tag Management
```typescript
// src/app/services/meta-tag.service.ts
@Injectable({ providedIn: 'root' })
export class MetaTagService {
  constructor(
    private meta: Meta,
    private title: Title
  ) {}

  updateRouteMetaTags(route: ActivatedRoute): void {
    const data = route.snapshot.data;

    if (data['title']) {
      this.title.setTitle(data['title']);
    }

    if (data['description']) {
      this.meta.updateTag({
        name: 'description',
        content: data['description']
      });
    }

    if (data['keywords']) {
      this.meta.updateTag({
        name: 'keywords',
        content: data['keywords']
      });
    }
  }
}
```

## 9. Implementation Checklist

### 9.1 Core Routing Setup
- [ ] Configure main application routes with lazy loading
- [ ] Implement AuthGuard and RoleGuard
- [ ] Set up route resolvers for data preloading
- [ ] Configure preloading strategy

### 9.2 Module Route Integration
- [ ] Update each module with proper route definitions
- [ ] Add route-level guards and resolvers
- [ ] Implement breadcrumb navigation
- [ ] Add route animations

### 9.3 Navigation System
- [ ] Create dynamic navigation service
- [ ] Implement role-based menu filtering
- [ ] Add mobile navigation patterns
- [ ] Set up navigation state management

### 9.4 SEO and Performance
- [ ] Configure meta tag management
- [ ] Implement network-aware preloading
- [ ] Add route transition animations
- [ ] Set up error boundary routes

---

**Document Version**: 1.0
**Last Updated**: 2025-09-26
**Status**: Ready for Implementation