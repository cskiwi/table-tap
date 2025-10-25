import { Route } from '@angular/router';
import { pageHomeRoutes } from '@app/frontend-pages-home';
import { roleGuard } from '@app/frontend-modules-auth/guard';

export const appRoutes: Route[] = [
  {
    path: '',
    children: pageHomeRoutes,
  },
  {
    path: 'menu',
    loadChildren: () => import('@app/frontend-modules-menu').then((m) => m.menuRoutes),
    title: 'Menu - TableTap',
  },
  {
    path: 'cart',
    loadChildren: () => import('@app/frontend-modules-cart').then((m) => m.cartRoutes),
    title: 'Cart - TableTap',
  },
  {
    path: 'order',
    loadChildren: () => import('@app/frontend-modules-order').then((m) => m.orderRoutes),
    canActivate: [roleGuard],
    data: { roles: ['customer'] },
    title: 'Orders - TableTap',
  },
  {
    path: 'kitchen',
    loadChildren: () => import('@app/frontend-modules-kitchen').then((m) => m.kitchenRoutes),
    canActivate: [roleGuard],
    data: { roles: ['kitchen_staff', 'admin'] },
    title: 'Kitchen - TableTap',
  },
  {
    path: 'admin',
    loadChildren: () => import('@app/frontend-modules-admin').then((m) => m.adminRoutes),
    canActivate: [roleGuard],
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
