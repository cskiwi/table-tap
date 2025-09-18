import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { Cafe } from './cafe.entity';
import { Permission } from './permission.entity';
import { Employee } from './employee.entity';

@ObjectType('EmployeeRole')
@Entity('EmployeeRoles')
@Index(['name', 'cafeId'], { unique: true })
export class EmployeeRole extends BaseEntity {
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
  @Column()
  declare name: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  declare description: string;

  @Field(() => Int)
  @Column({ default: 1 })
  declare level: number; // Hierarchical level (1 = lowest, higher = more authority)

  @Field(() => Boolean, { defaultValue: true })
  @Column({ default: true })
  declare isActive: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare isSystemRole: boolean; // Cannot be deleted, system-managed

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare capabilities: {
    maxOrderValue?: number;
    canApproveTimesheets?: boolean;
    canProcessRefunds?: boolean;
    canAccessReports?: boolean;
    canManageInventory?: boolean;
    canScheduleShifts?: boolean;
    canOverrideOrders?: boolean;
    maxAllowanceAmount?: number;
  };

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare restrictions: {
    workingHours?: { start: string; end: string }[];
    daysOfWeek?: number[];
    maxConsecutiveHours?: number;
    requiredBreakInterval?: number;
    locationRestrictions?: string[];
  };

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare compensation: {
    baseHourlyRate?: number;
    overtimeMultiplier?: number;
    allowances?: {
      daily?: number;
      weekly?: number;
      monthly?: number;
    };
    bonusEligible?: boolean;
    tipPoolEligible?: boolean;
  };

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare cafeId: string; // null for global/system roles

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare parentRoleId: string; // For role hierarchy

  // Relations
  @Field(() => Cafe, { nullable: true })
  @ManyToOne(() => Cafe, { nullable: true })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  @Field(() => EmployeeRole, { nullable: true })
  @ManyToOne(() => EmployeeRole, (role) => role.childRoles, { nullable: true })
  @JoinColumn({ name: 'parentRoleId' })
  declare parentRole: EmployeeRole;

  @Field(() => [EmployeeRole], { nullable: true })
  @OneToMany(() => EmployeeRole, (role) => role.parentRole)
  declare childRoles: EmployeeRole[];

  @Field(() => [Permission])
  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
  @JoinTable({
    name: 'RolePermissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  declare permissions: Permission[];

  @Field(() => [Employee], { nullable: true })
  @OneToMany(() => Employee, (employee) => employee.role)
  declare employees: Employee[];

  // Computed fields
  @Field(() => Boolean)
  get isManagerLevel(): boolean {
    return this.level >= 3; // Manager level and above
  }

  @Field(() => Boolean)
  get isGlobalRole(): boolean {
    return !this.cafeId;
  }

  @Field(() => Int)
  get employeeCount(): number {
    return this.employees?.length || 0;
  }

  @Field(() => [String])
  get permissionNames(): string[] {
    return this.permissions?.map(p => p.name) || [];
  }

  @Field(() => Boolean)
  get canDeleteRole(): boolean {
    return !this.isSystemRole && this.employeeCount === 0;
  }
}