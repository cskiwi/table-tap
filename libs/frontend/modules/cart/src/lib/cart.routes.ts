import { Routes } from '@angular/router';

export const cartRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/cart-display/cart-display.component').then(
        c => c.CartDisplayComponent
      ),
    title: 'Shopping Cart - TableTap'
  }
];