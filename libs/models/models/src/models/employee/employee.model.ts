import { SortableField } from '@app/utils';
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
  JoinColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { Cafe } from '../core/cafe.model';
import { User } from '../core/user.model';
import { TimeSheet } from './time-sheet.model';

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
  @Field()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, (cafe) => cafe.employees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // User relationship (optional - some employees may not have app access)
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @Index()
  declare userId: string;

  @ManyToOne(() => User, (user) => user.employeeProfiles, { nullable: true })
  @JoinColumn({ name: 'userId' })
  declare user: Relation<User>;

  // Employee identification
  @Field()
  @Column({ unique: true })
  @IsString()
  @Index({ unique: true })
  declare employeeId: string; // e.g., "EMP001"

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare badgeNumber: string;

  // Personal Information
  @Field()
  @Column()
  @IsString()
  @Index({ fulltext: true })
  declare firstName: string;

  @Field()
  @Column()
  @IsString()
  @Index({ fulltext: true })
  declare lastName: string;

  @Field({ nullable: true })
  @Column({ nullable: true, unique: true })
  @IsString()
  @IsOptional()
  @Index({ unique: true, where: 'email IS NOT NULL' })
  declare email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare phone: string;

  // Employment details
  @Field()
  @Column('enum', { enum: UserRole, default: UserRole.EMPLOYEE })
  @IsEnum(UserRole)
  declare position: UserRole;

  @Field()
  @Column('enum', { enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  @IsEnum(EmployeeStatus)
  declare status: EmployeeStatus;

  @Field()
  @Column('date')
  @IsDateString()
  declare hireDate: Date;

  @Field({ nullable: true })
  @Column('date', { nullable: true })
  @IsDateString()
  @IsOptional()
  declare terminationDate: Date;

  // Compensation
  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare hourlyRate: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare salary: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare payType: string; // 'hourly', 'salary', 'commission'

  // Work settings
  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  declare countersAccess: string[]; // Counter IDs this employee can work on

  @Field({ nullable: true })
  @Column('json', { nullable: true })
  declare workingHours: {
    [key: string]: {
      // day of week
      isWorking: boolean;
      startTime?: string;
      endTime?: string;
    };
  };

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare maxHoursPerWeek: number;

  // Permissions and access
  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare canProcessPayments: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare canRefundOrders: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare canCancelOrders: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare canViewReports: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare canManageInventory: boolean;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountLimit: number; // Maximum discount percentage they can apply

  // Current status tracking
  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isClockedIn: boolean;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastClockIn: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastClockOut: Date;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare currentCounterId: string; // Counter they're currently assigned to

  // Emergency contact
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare emergencyContactName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare emergencyContactPhone: string;

  // Additional information
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  // Relations
  @OneToMany(() => TimeSheet, (timeSheet) => timeSheet.employee)
  declare timeSheets: Relation<TimeSheet[]>;

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

    if (!this.workingHours?.[todayKey]) return false;
    return this.workingHours[todayKey].isWorking;
  }

  @Field({ nullable: true })
  get currentShiftDuration(): number | null {
    if (!this.isClockedIn || !this.lastClockIn) return null;
    return Math.round((new Date().getTime() - this.lastClockIn.getTime()) / 60000); // in minutes
  }
}
