import { SortableField, WhereField } from '@app/utils';
import { EmployeeStatus, UserRole } from '@app/models/enums';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Cafe, User } from '../core';
import { TimeSheet } from './attendance';
import { EmployeeWorkingHours } from './scheduling';
import { EmployeeEmergencyContact } from './employee-emergency-contact.model';

@ObjectType('Employee')
@Entity('Employees')
@Index(['cafeId', 'status'])
export class Employee extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @SortableField({ nullable: true })
  @DeleteDateColumn({ nullable: true })
  declare deletedAt: Date;

  // Multi-tenant support
  @WhereField()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, (cafe) => cafe.employees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // User relationship (optional - some employees may not have app access)
  @WhereField({ nullable: true })
  @Column('uuid', { nullable: true })
  @Index()
  declare userId: string;

  @ManyToOne(() => User, (user) => user.employeeProfiles, { nullable: true })
  @JoinColumn({ name: 'userId' })
  declare user: Relation<User>;

  // Employee identification
  @SortableField()
  @WhereField()
  @Column({ unique: true })
  @IsString()
  @Index({ unique: true })
  declare employeeId: string; // e.g., "EMP001"

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare badgeNumber: string;

  // Personal Information
  @WhereField()
  @Column()
  @IsString()
  @Index({ fulltext: true })
  declare firstName: string;

  @WhereField()
  @Column()
  @IsString()
  @Index({ fulltext: true })
  declare lastName: string;

  @SortableField({ nullable: true })
  @WhereField({ nullable: true })
  @Column({ nullable: true, unique: true })
  @IsString()
  @IsOptional()
  @Index({ unique: true, where: '"email" IS NOT NULL' })
  declare email: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare phone: string;

  // Employment details
  @SortableField()
  @WhereField(() => UserRole)
  @Column('enum', { enum: UserRole, default: UserRole.EMPLOYEE })
  @IsEnum(UserRole)
  declare position: UserRole;

  // Alias for position
  get role(): UserRole {
    return this.position;
  }
  set role(value: UserRole) {
    this.position = value;
  }

  @SortableField()
  @WhereField(() => EmployeeStatus)
  @Column('enum', { enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  @IsEnum(EmployeeStatus)
  declare status: EmployeeStatus;
  declare status: EmployeeStatus;

  @SortableField()
  @WhereField()
  @Column('date')
  @IsDateString()
  declare hireDate: Date;

  @WhereField({ nullable: true })
  @Column('date', { nullable: true })
  @IsDateString()
  @IsOptional()
  declare terminationDate: Date;

  // Compensation
  @WhereField({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare hourlyRate: number;

  @WhereField({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare salary: number;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare payType: string; // 'hourly', 'salary', 'commission'

  // Work settings
  @WhereField(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  declare countersAccess: string[]; // Counter IDs this employee can work on

  @OneToMany(() => EmployeeWorkingHours, hours => hours.employee, { cascade: true })
  declare workingHours: Relation<EmployeeWorkingHours[]>;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare maxHoursPerWeek: number;

  // Permissions and access
  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare canProcessPayments: boolean;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare canRefundOrders: boolean;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare canCancelOrders: boolean;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare canViewReports: boolean;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare canManageInventory: boolean;

  @WhereField({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountLimit: number; // Maximum discount percentage they can apply

  // Current status tracking
  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare isClockedIn: boolean;

  @WhereField({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastClockIn: Date;

  @WhereField({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastClockOut: Date;

  @WhereField({ nullable: true })
  @Column('uuid', { nullable: true })
  declare currentCounterId: string; // Counter they're currently assigned to

  // Emergency contact
  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare emergencyContactName: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare emergencyContactPhone: string;

  // Additional information
  @WhereField({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  // Relations
  @OneToMany(() => TimeSheet, (timeSheet) => timeSheet.employee)
  declare timeSheets: Relation<TimeSheet[]>;

  @OneToOne(() => EmployeeEmergencyContact, (contact) => contact.employee, { nullable: true })
  declare emergencyContact: Relation<EmployeeEmergencyContact>;

  // Computed fields
  @SortableField()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Field()
  get isActive(): boolean {
    return this.status === EmployeeStatus.ACTIVE;
  }

  @Field()
  get displayName(): string {
    return `${this.fullName} (${this.employeeId})`;
  }

  @Field()
  get canWorkToday(): boolean {
    const todayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

    if (!this.workingHours) return false;
    const todayHours = this.workingHours.find(hours => hours.dayOfWeek === todayKey);
    if (!todayHours) return false;
    return todayHours.isWorking;
  }

  @Field(() => Number, { nullable: true })
  get currentShiftDuration(): number | null {
    if (!this.isClockedIn || !this.lastClockIn) return null;
    return Math.round((new Date().getTime() - this.lastClockIn.getTime()) / 60000); // in minutes
  }
}
