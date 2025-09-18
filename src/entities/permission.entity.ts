import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EmployeeRole } from './employee-role.entity';

@ObjectType('Permission')
@Entity('Permissions')
@Index(['resource', 'action'], { unique: true })
export class Permission extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field()
  @Column({ unique: true })
  declare name: string;

  @Field()
  @Column()
  @Index()
  declare resource: string; // e.g., 'orders', 'employees', 'timesheets'

  @Field()
  @Column()
  @Index()
  declare action: string; // e.g., 'create', 'read', 'update', 'delete', 'approve'

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  declare description: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare conditions: {
    // Conditional permissions based on context
    ownRecordsOnly?: boolean;
    maxValue?: number;
    timeRestrictions?: { start: string; end: string }[];
    locationRestrictions?: string[];
    roleHierarchy?: boolean; // Can only act on lower-level roles
    cafeScope?: boolean; // Limited to own cafe
    shiftTime?: boolean; // Only during active shift
  };

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare metadata: {
    category?: string; // e.g., 'core', 'financial', 'administrative'
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    auditRequired?: boolean;
    requiresApproval?: boolean;
    delegatable?: boolean; // Can this permission be temporarily delegated
  };

  @Field(() => Boolean, { defaultValue: true })
  @Column({ default: true })
  declare isActive: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare isSystemPermission: boolean; // Cannot be deleted

  // Relations
  @Field(() => [EmployeeRole], { nullable: true })
  @ManyToMany(() => EmployeeRole, (role) => role.permissions)
  declare roles: EmployeeRole[];

  // Computed fields
  @Field()
  get fullName(): string {
    return `${this.resource}:${this.action}`;
  }

  @Field(() => Boolean)
  get isHighRisk(): boolean {
    return this.metadata?.riskLevel === 'high' || this.metadata?.riskLevel === 'critical';
  }

  @Field(() => Boolean)
  get requiresAudit(): boolean {
    return this.metadata?.auditRequired === true || this.isHighRisk;
  }

  @Field()
  get category(): string {
    return this.metadata?.category || 'general';
  }

  @Field(() => Boolean)
  get canBeDeleted(): boolean {
    return !this.isSystemPermission && (!this.roles || this.roles.length === 0);
  }

  // Static permission definitions for common operations
  static readonly CORE_PERMISSIONS = [
    // Time Tracking
    { name: 'clock_in_out', resource: 'timesheet', action: 'create', description: 'Clock in and out' },
    { name: 'view_own_timesheet', resource: 'timesheet', action: 'read', description: 'View own timesheet', conditions: { ownRecordsOnly: true } },
    { name: 'approve_timesheets', resource: 'timesheet', action: 'approve', description: 'Approve employee timesheets' },

    // Personal Orders
    { name: 'place_personal_order', resource: 'personal_order', action: 'create', description: 'Place personal orders' },
    { name: 'view_own_consumption', resource: 'personal_order', action: 'read', description: 'View own consumption history', conditions: { ownRecordsOnly: true } },
    { name: 'approve_personal_orders', resource: 'personal_order', action: 'approve', description: 'Approve employee personal orders' },

    // Proxy Orders
    { name: 'process_customer_orders', resource: 'proxy_order', action: 'create', description: 'Process customer orders' },
    { name: 'view_proxy_orders', resource: 'proxy_order', action: 'read', description: 'View proxy order history' },
    { name: 'modify_proxy_orders', resource: 'proxy_order', action: 'update', description: 'Modify proxy orders' },

    // Employee Management
    { name: 'view_employee_list', resource: 'employee', action: 'read', description: 'View employee list' },
    { name: 'manage_employees', resource: 'employee', action: 'update', description: 'Manage employee details' },
    { name: 'create_employees', resource: 'employee', action: 'create', description: 'Create new employees' },

    // Role Management
    { name: 'view_roles', resource: 'role', action: 'read', description: 'View role definitions' },
    { name: 'manage_roles', resource: 'role', action: 'update', description: 'Manage roles and permissions' },

    // Reports and Analytics
    { name: 'view_performance_reports', resource: 'report', action: 'read', description: 'View performance reports' },
    { name: 'view_consumption_reports', resource: 'report', action: 'read', description: 'View consumption reports' },
    { name: 'export_reports', resource: 'report', action: 'export', description: 'Export reports' },

    // System Administration
    { name: 'manage_cafe_settings', resource: 'cafe', action: 'update', description: 'Manage cafe settings' },
    { name: 'manage_allowances', resource: 'allowance', action: 'update', description: 'Manage employee allowances' },
    { name: 'system_administration', resource: 'system', action: 'admin', description: 'System administration access' },
  ];
}