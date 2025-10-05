import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SetMetadata } from '@nestjs/common';
import { User } from '@app/models';
import { UserRole, EmployeeStatus } from '@app/models';

// Decorator for setting required roles
export const RequireRoles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Decorator for setting required permissions
export const RequirePermissions = (...permissions: string[]) => SetMetadata('permissions', permissions);

// Decorator for setting resource-level access
export const RequireResourceAccess = (resource: string, action: string) =>
  SetMetadata('resourceAccess', { resource, action });

// Decorator for setting cafe-level access
export const RequireCafeAccess = () => SetMetadata('cafeAccess', true);

export interface UserWithEmployeeInfo extends User {
  employees?: Array<{
    id: string;
    cafeId: string;
    role: UserRole;
    status: EmployeeStatus;
    permissions: string[]
    assignedCounterId?: string;
  }>;
  currentCafeId?: string;
  currentEmployee?: {
    id: string;
    role: UserRole;
    permissions: string[]
  }
}

@Injectable()
export class RoleBasedAccessGuard implements CanActivate {
  private readonly logger = new Logger(RoleBasedAccessGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get GraphQL context
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext()
    const user = req.user as UserWithEmployeeInfo;

    if (!user) {
      this.logger.warn('No user found in request context');
      return false;
    }

    // Get metadata from decorators
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    const resourceAccess = this.reflector.get<{ resource: string; action: string }>('resourceAccess', context.getHandler());
    const requiresCafeAccess = this.reflector.get<boolean>('cafeAccess', context.getHandler());

    // If no specific requirements, allow access
    if (!requiredRoles && !requiredPermissions && !resourceAccess && !requiresCafeAccess) {
      return true;
    }

    // Get arguments to extract cafeId if needed
    const args = gqlContext.getArgs()
    const cafeId = args.cafeId || args.input?.cafeId;

    try {
      // Check cafe-level access
      if (requiresCafeAccess && cafeId) {
        const hasAccess = await this.checkCafeAccess(user, cafeId);
        if (!hasAccess) {
          this.logger.warn(`User ${user.id} denied access to cafe ${cafeId}`);
          throw new ForbiddenException('Insufficient cafe access');
        }
      }

      // Check role-based access
      if (requiredRoles) {
        const hasRole = await this.checkRoleAccess(user, requiredRoles, cafeId);
        if (!hasRole) {
          this.logger.warn(`User ${user.id} lacks required roles: ${requiredRoles.join(', ')}`);
          throw new ForbiddenException('Insufficient role permissions');
        }
      }

      // Check permission-based access
      if (requiredPermissions) {
        const hasPermissions = await this.checkPermissionAccess(user, requiredPermissions, cafeId);
        if (!hasPermissions) {
          this.logger.warn(`User ${user.id} lacks required permissions: ${requiredPermissions.join(', ')}`);
          throw new ForbiddenException('Insufficient permissions');
        }
      }

      // Check resource-level access
      if (resourceAccess) {
        const hasResourceAccess = await this.checkResourceAccess(user, resourceAccess, args);
        if (!hasResourceAccess) {
          this.logger.warn(`User ${user.id} denied ${resourceAccess.action} access to ${resourceAccess.resource}`);
          throw new ForbiddenException('Insufficient resource access');
        }
      }

      return true;

    } catch (error) {
      this.logger.error(`Access control error for user ${user.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async checkCafeAccess(user: UserWithEmployeeInfo, cafeId: string): Promise<boolean> {
    // Check if user is an employee at this cafe
    if (user.employees) {
      return user.employees.some(emp =>
        emp.cafeId === cafeId && emp.status === EmployeeStatus.ACTIVE
      );
    }

    // If no employee data loaded, this would require a database check
    // For now, assume access is granted if user has currentCafeId set
    return user.currentCafeId === cafeId;
  }

  private async checkRoleAccess(user: UserWithEmployeeInfo, requiredRoles: UserRole[], cafeId?: string): Promise<boolean> {
    if (user.employees) {
      return user.employees.some(emp => {
        // Check if employee is at the right cafe (if specified)
        const cafeMatch = !cafeId || emp.cafeId === cafeId;
        // Check if employee has required role and is active
        const roleMatch = requiredRoles.includes(emp.role);
        const isActive = emp.status === EmployeeStatus.ACTIVE;

        return cafeMatch && roleMatch && isActive;
      });
    }

    // Fallback check using current employee context
    if (user.currentEmployee) {
      return requiredRoles.includes(user.currentEmployee.role);
    }

    return false;
  }

  private async checkPermissionAccess(user: UserWithEmployeeInfo, requiredPermissions: string[], cafeId?: string): Promise<boolean> {
    if (user.employees) {
      return user.employees.some(emp => {
        // Check if employee is at the right cafe (if specified)
        const cafeMatch = !cafeId || emp.cafeId === cafeId;
        const isActive = emp.status === EmployeeStatus.ACTIVE;

        if (!cafeMatch || !isActive) return false;

        // Check if employee has all required permissions or wildcard permission
        const hasWildcard = emp.permissions.includes('*');
        const hasAllPermissions = requiredPermissions.every(perm =>
          emp.permissions.includes(perm)
        );

        return hasWildcard || hasAllPermissions;
      });
    }

    // Fallback check using current employee context
    if (user.currentEmployee) {
      const hasWildcard = user.currentEmployee.permissions.includes('*');
      const hasAllPermissions = requiredPermissions.every(perm =>
        user.currentEmployee!.permissions.includes(perm)
      );
      return hasWildcard || hasAllPermissions;
    }

    return false;
  }

  private async checkResourceAccess(
    user: UserWithEmployeeInfo,
    resourceAccess: { resource: string; action: string },
    args: any
  ): Promise<boolean> {
    const { resource, action } = resourceAccess;

    switch (resource) {
      case 'order':
        return this.checkOrderAccess(user, action, args);
      case 'inventory':
        return this.checkInventoryAccess(user, action, args);
      case 'employee':
        return this.checkEmployeeAccess(user, action, args);
      case 'counter':
        return this.checkCounterAccess(user, action, args);
      default:
        this.logger.warn(`Unknown resource type: ${resource}`);
        return false;
    }
  }

  private checkOrderAccess(user: UserWithEmployeeInfo, action: string, args: any): boolean {
    switch (action) {
      case 'view':
        // Employees can view orders at their cafe
        // Customers can view their own orders
        return this.hasPermission(user, 'view_orders') || this.isOrderOwner(user, args.id);

      case 'create':
        return this.hasPermission(user, 'create_orders');

      case 'update':
        return this.hasPermission(user, 'manage_orders') || this.hasPermission(user, 'update_order_status');

      case 'cancel':
        return this.hasPermission(user, 'manage_orders') || this.isOrderOwner(user, args.id);

      default:
        return false;
    }
  }

  private checkInventoryAccess(user: UserWithEmployeeInfo, action: string, args: any): boolean {
    switch (action) {
      case 'view':
        return this.hasPermission(user, 'view_inventory');

      case 'manage':
        return this.hasPermission(user, 'manage_inventory');

      case 'update_stock':
        return this.hasPermission(user, 'manage_inventory') || this.hasPermission(user, 'update_stock');

      default:
        return false;
    }
  }

  private checkEmployeeAccess(user: UserWithEmployeeInfo, action: string, args: any): boolean {
    switch (action) {
      case 'view':
        return this.hasPermission(user, 'view_employees');

      case 'manage':
        return this.hasPermission(user, 'manage_employees');

      case 'view_self':
        // Employees can view their own information
        return args.id === user.currentEmployee?.id || this.hasPermission(user, 'view_employees');

      default:
        return false;
    }
  }

  private checkCounterAccess(user: UserWithEmployeeInfo, action: string, args: any): boolean {
    switch (action) {
      case 'operate':
        // Employees can operate their assigned counter or any counter if they have permission
        return this.isAssignedToCounter(user, args.counterId) || this.hasPermission(user, 'operate_any_counter');

      default:
        return false;
    }
  }

  private hasPermission(user: UserWithEmployeeInfo, permission: string): boolean {
    if (user.currentEmployee) {
      return user.currentEmployee.permissions.includes('*') ||
             user.currentEmployee.permissions.includes(permission);
    }

    if (user.employees) {
      return user.employees.some(emp =>
        emp.status === EmployeeStatus.ACTIVE &&
        (emp.permissions.includes('*') || emp.permissions.includes(permission))
      );
    }

    return false;
  }

  private isOrderOwner(user: UserWithEmployeeInfo, orderId: string): boolean {
    // This would require a database lookup to check if user owns the order
    // For now, return false and let the service layer handle ownership checks
    return false;
  }

  private isAssignedToCounter(user: UserWithEmployeeInfo, counterId: string): boolean {
    if (user.currentEmployee && user.employees) {
      const currentEmp = user.employees.find(emp => emp.id === user.currentEmployee!.id);
      return currentEmp?.assignedCounterId === counterId;
    }
    return false;
  }
}

/**
 * Context enhancement middleware to load employee information
 */
@Injectable()
export class EmployeeContextEnhancer {
  private readonly logger = new Logger(EmployeeContextEnhancer.name);

  constructor(
    // Inject employee repository if needed
  ) {}

  async enhanceUserContext(user: User, cafeId?: string): Promise<UserWithEmployeeInfo> {
    try {
      // This would load employee data from database
      // For now, return user as-is with placeholder implementation
      const enhancedUser = user as UserWithEmployeeInfo;

      // In a real implementation, you would:
      // 1. Load user's employee records
      // 2. Set currentCafeId based on context (e.g., from request headers)
      // 3. Set currentEmployee based on current cafe context

      this.logger.debug(`Enhanced context for user ${user.id}`);
      return enhancedUser;

    } catch (error) {
      this.logger.error(`Failed to enhance user context: ${error.message}`, error.stack);
      return user as UserWithEmployeeInfo;
    }
  }
}

/**
 * Permission definitions for different roles
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.CUSTOMER]: [
    'view_menu', 'create_orders', 'view_own_orders'
  ],
  [UserRole.EMPLOYEE]: [
    'view_orders', 'update_order_status', 'view_menu'
  ],
  [UserRole.MANAGER]: [
    'view_all_orders', 'manage_orders', 'view_inventory', 'manage_inventory',
    'view_employees', 'manage_employees', 'view_reports', 'manage_cafe',
    'view_schedule', 'manage_schedule'
  ],
  [UserRole.ADMIN]: ['*'], // All permissions
  [UserRole.OWNER]: ['*'], // All permissions
  [UserRole.CASHIER]: [
    'view_orders', 'create_orders', 'process_payments', 'view_menu'
  ],
  [UserRole.BARISTA]: [
    'view_orders', 'update_order_status', 'view_inventory', 'view_menu'
  ],
  [UserRole.KITCHEN]: [
    'view_orders', 'update_order_status', 'view_inventory', 'view_menu'
  ],
  [UserRole.WAITER]: [
    'view_orders', 'create_orders', 'update_order_status', 'view_menu'
  ],
}

/**
 * Utility functions for permission checking
 */
export class PermissionUtils {
  static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes('*') || userPermissions.includes(requiredPermission);
  }

  static hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    if (userPermissions.includes('*')) return true;
    return requiredPermissions.some(perm => userPermissions.includes(perm));
  }

  static hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    if (userPermissions.includes('*')) return true;
    return requiredPermissions.every(perm => userPermissions.includes(perm));
  }

  static getPermissionsForRole(role: UserRole): string[] {
    return ROLE_PERMISSIONS[role] || []
  }
}