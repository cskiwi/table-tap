import { Routes } from '@angular/router';

export const kitchenRoutes: Routes = [
  {
    path: '',
    redirectTo: 'display',
    pathMatch: 'full',
  }
  {
    path: 'display',
    loadComponent: () =>
      import('./components/kitchen-display/kitchen-display.component').then(
        c => c.KitchenDisplayComponent
      )
    title: 'Kitchen Display - TableTap',
  }
  {
    path: 'metrics',
    loadComponent: () =>
      import('./components/metrics-dashboard/metrics-dashboard.component').then(
        c => c.MetricsDashboardComponent
      )
    title: 'Kitchen Metrics - TableTap',
  }
  {
    path: '**',
    redirectTo: 'display',
  }
  ];