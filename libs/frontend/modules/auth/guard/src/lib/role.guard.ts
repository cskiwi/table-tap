import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@app/frontend-modules-auth/service';
import { map } from 'rxjs/operators';

export type UserRole = 'admin' | 'employee' | 'customer' | 'kitchen_staff';

export interface RoleGuardData {
  roles: UserRole[]
  redirectTo?: string;
}

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data?.['roles'] as UserRole[] || []
  const redirectTo = route.data?.['redirectTo'] as string || '/';

  return authService.state.user$.pipe(
    map(user => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }

      // If no specific roles required, just check if authenticated
      if (requiredRoles.length === 0) {
        return true;
      }

      // Check if user has one of the required roles
      const userRole = user.role as UserRole;
      const hasRequiredRole = requiredRoles.includes(userRole);

      if (!hasRequiredRole) {
        router.navigate([redirectTo]);
        return false;
      }

      return true;
    })
  );
}