import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login.component').then(c => c.LoginComponent),
    title: 'Login - TableTap',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register.component').then(c => c.RegisterComponent),
    title: 'Register - TableTap',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/forgot-password.component').then(c => c.ForgotPasswordComponent),
    title: 'Forgot Password - TableTap',
  },
  {
    path: '**',
    redirectTo: 'login',
  }
  ];