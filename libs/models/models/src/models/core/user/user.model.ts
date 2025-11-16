import { SortableField, WhereField } from '@app/utils';
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
  ManyToMany,
  OneToOne,
  OneToMany,
  JoinTable,
  Relation,
} from 'typeorm';
import { UserPreferences } from './user-preferences.model';
import { Employee } from '../../employee';
import { LoyaltyAccount } from '../../loyalty';
import { Order, Credit } from '../../order';
import { Cafe } from '../cafe';

@ObjectType('User')
@Entity('Users')
@Index(['firstName', 'lastName'])
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

  // Multi-tenant support - User can have permissions for multiple cafes
  // Relationship is managed through UserCafes join table
  @ManyToMany(() => Cafe, (cafe) => cafe.users)
  @JoinTable({
    name: 'UserCafes',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'cafeId', referencedColumnName: 'id' },
  })
  declare cafes: Relation<Cafe[]>;

  // Authentication
  @IsString()
  @Index({ unique: true })
  @Column({ unique: true, nullable: true })
  declare sub?: string;

  @SortableField({ nullable: true })
  @WhereField({ nullable: true })
  @Column({ nullable: true, unique: true })
  @IsEmail()
  @IsOptional()
  @Index({ unique: true, where: '"email" IS NOT NULL' })
  declare email: string;

  @WhereField({ nullable: true })
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

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare avatar: string;

  // Role and Status
  @SortableField(() => UserRole)
  @WhereField(() => UserRole)
  @Column('enum', { enum: UserRole, default: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  declare role: UserRole;

  @SortableField(() => UserStatus)
  @WhereField(() => UserStatus)
  @Column('enum', { enum: UserStatus, default: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  declare status: UserStatus;

  // Customer-specific fields
  @WhereField({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare creditBalance: number;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare isVip: boolean;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare loyaltyNumber: string;

  @OneToOne(() => UserPreferences, (preferences) => preferences.user, { cascade: true })
  declare preferences: Relation<UserPreferences>;

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
