import { SortableField } from '@app/utils';
import { UserRole, UserStatus } from '@app/models/enums';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsEnum, IsEmail, IsPhoneNumber, IsNumber } from 'class-validator';
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
import { Cafe } from './cafe.model';
import { Order } from '../order/order.model';
import { Credit } from '../order/credit.model';
import { Employee } from '../employee/employee.model';
import { LoyaltyAccount } from '../loyalty/loyalty-account.model';

@ObjectType('User')
@Entity('Users')
@Index(['firstName', 'lastName'])
@Index(['cafeId', 'role'])
export class User extends BaseEntity {
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

  @ManyToOne(() => Cafe, (cafe) => cafe.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Authentication
  @Index({ unique: true })
  @Column({ unique: true })
  @IsString()
  declare sub: string;

  @Field({ nullable: true })
  @Column({ nullable: true, unique: true })
  @IsEmail()
  @IsOptional()
  @Index({ unique: true, where: '"email" IS NOT NULL' })
  declare email: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsPhoneNumber()
  @IsOptional()
  @Index({ where: '"phone" IS NOT NULL' })
  declare phone: string;

  // User Information
  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  @Index({ fulltext: true })
  declare firstName: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  @Index({ fulltext: true })
  declare lastName: string;

  @Index({ unique: true })
  @SortableField()
  @Column()
  @IsString()
  declare slug: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare avatar: string;

  // Role and Status
  @Field()
  @Column('enum', { enum: UserRole, default: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  declare role: UserRole;

  @Field()
  @Column('enum', { enum: UserStatus, default: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  declare status: UserStatus;

  // Customer-specific fields
  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare creditBalance: number;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isVip: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare loyaltyNumber: string;

  @Field({ nullable: true })
  @Column('json', { nullable: true })
  declare preferences: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    dietary?: string[];
    favoriteProducts?: string[];
    defaultPaymentMethod?: string;
  };

  // Employee reference (for employees who are also users)
  @OneToMany(() => Employee, (employee) => employee.user)
  declare employeeProfiles: Relation<Employee[]>;

  // Relations
  @OneToMany(() => Order, (order) => order.customer)
  declare orders: Relation<Order[]>;

  @OneToMany(() => Order, (order) => order.createdByEmployee, { nullable: true })
  declare ordersCreatedByEmployee: Relation<Order[]>;

  @OneToMany(() => Credit, (credit) => credit.user)
  declare credits: Relation<Credit[]>;

  @OneToMany(() => LoyaltyAccount, (account) => account.user)
  declare loyaltyAccount: Relation<LoyaltyAccount[]>;

  // Computed fields
  @SortableField()
  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  @Field()
  get displayName(): string {
    return this.fullName || this.email || this.phone || 'Anonymous';
  }

  @Field()
  get isEmployee(): boolean {
    return [
      UserRole.EMPLOYEE,
      UserRole.MANAGER,
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CASHIER,
      UserRole.BARISTA,
      UserRole.KITCHEN,
      UserRole.WAITER,
    ].includes(this.role);
  }
}
