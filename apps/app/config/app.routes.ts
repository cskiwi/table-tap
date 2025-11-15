import { Route } from '@angular/router';
import { pageHomeRoutes } from '@app/frontend-pages-home';
import { RoleGuard, CafeGuard } from '@app/frontend-modules-auth/guard';

export const appRoutes: Route[] = [
  {
    path: '',
    children: pageHomeRoutes,
  },
  {
    path: 'menu',
    loadChildren: () => import('@app/frontend-modules-menu').then((m) => m.menuRoutes),
    canActivate: [CafeGuard],
    title: 'Menu - TableTap',
  },
  {
    path: 'cart',
    loadChildren: () => import('@app/frontend-modules-cart').then((m) => m.cartRoutes),
    canActivate: [CafeGuard],
    title: 'Cart - TableTap',
  },
  {
    path: 'order',
    loadChildren: () => import('@app/frontend-modules-order').then((m) => m.orderRoutes),
    canActivate: [CafeGuard, RoleGuard],
    data: { roles: ['customer'] },
    title: 'Orders - TableTap',
  },
  {
    path: 'kitchen',
    loadChildren: () => import('@app/frontend-modules-kitchen').then((m) => m.kitchenRoutes),
    canActivate: [CafeGuard, RoleGuard],
    data: { roles: ['kitchen_staff', 'admin'] },
    title: 'Kitchen - TableTap',
  },
  {
    path: 'admin',
    loadChildren: () => import('@app/frontend-modules-admin').then((m) => m.adminRoutes),
    canActivate: [CafeGuard, RoleGuard],
    data: { roles: ['admin'] },
    title: 'Admin - TableTap',
  },
  {
    path: 'auth',
    loadChildren: () => import('@app/frontend-modules-auth').then((m) => m.authRoutes),
    title: 'Authentication - TableTap',
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
