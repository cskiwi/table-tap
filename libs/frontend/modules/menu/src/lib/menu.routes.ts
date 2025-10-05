import { Routes } from '@angular/router';

export const menuRoutes: Routes = [
  {
    path: '',
    redirectTo: 'display',
    pathMatch: 'full',
  },
  {
    path: 'display',
    loadComponent: () =>
      import('./components/menu-display.component').then(
        c => c.MenuDisplayComponent
      ),
    title: 'Menu - TableTap',
  },
  {
    path: 'item/:id',
    loadComponent: () =>
      import('./components/menu-item-detail.component').then(
        c => c.MenuItemDetailComponent
      ),
    title: 'Menu Item Details - TableTap',
  },
  {
    path: '**',
    redirectTo: 'display',
  }
];