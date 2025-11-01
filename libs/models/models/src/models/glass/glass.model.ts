import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
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
} from 'typeorm';
import { GlassMovement } from './glass-movement.model';
import { Cafe, User } from '../core';
import { Order } from '../order';

@ObjectType('Glass')
@Entity('Glasses')
@Index(['cafeId', 'rfidTag'], { unique: true })
@Index(['cafeId', 'status'])
export class Glass extends BaseEntity {
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

  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  // Glass identification
  @Field()
  @Column({ unique: true })
  @IsString()
  @Index({ unique: true })
  declare glassNumber: string; // e.g., "G001"

  @Field({ nullable: true })
  @Column({ nullable: true, unique: true })
  @IsString()
  @IsOptional()
  @Index({ unique: true, where: '"rfidTag" IS NOT NULL' })
  declare rfidTag: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare qrCode: string;

  // Glass details
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare type: string; // 'standard', 'large', 'small', 'specialty'

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare capacity: number; // in ml

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare material: string; // 'glass', 'plastic', 'ceramic'

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare color: string;

  // Current status
  @Field()
  @Column({ default: 'available' })
  @IsString()
  declare status: string; // 'available', 'in_use', 'dirty', 'cleaning', 'lost', 'broken', 'retired'

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare currentCustomerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'currentCustomerId' })
  declare currentCustomer: User;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare currentOrderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'currentOrderId' })
  declare currentOrder: Order;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare currentLocation: string; // 'counter', 'customer', 'washing', 'storage'

  // Lifecycle tracking
  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastIssuedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastReturnedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastCleanedAt: Date;

  @Field()
  @Column({ default: 0 })
  @IsNumber()
  declare usageCount: number; // How many times this glass has been used

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare depositAmount: number; // Deposit charged for this glass

  // Maintenance
  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isActive: boolean;

  @Field({ nullable: true })
  @Column('date', { nullable: true })
  declare purchaseDate: Date;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare purchaseCost: number;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  // Relations
  @OneToMany(() => GlassMovement, (movement) => movement.glass)
  declare movements: GlassMovement[];

  // Computed fields
  @Field()
  get isAvailable(): boolean {
    return this.status === 'available' && this.isActive;
  }

  @Field()
  get isInUse(): boolean {
    return ['in_use', 'dirty'].includes(this.status);
  }

  @Field()
  get needsCleaning(): boolean {
    return this.status === 'dirty';
  }

  @Field()
  get isLost(): boolean {
    return this.status === 'lost';
  }

  @Field()
  get isBroken(): boolean {
    return this.status === 'broken';
  }

  @Field({ nullable: true })
  get daysSinceLastUse(): number | null {
    if (!this.lastReturnedAt) return null;
    return Math.floor((new Date().getTime() - this.lastReturnedAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  @Field({ nullable: true })
  get daysSinceLastClean(): number | null {
    if (!this.lastCleanedAt) return null;
    return Math.floor((new Date().getTime() - this.lastCleanedAt.getTime()) / (1000 * 60 * 60 * 24));
  }
}

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class GlassUpdateInput extends PartialType(
  OmitType(Glass, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'currentCustomer',
    'currentOrder',
    'movements',
    'isAvailable',
    'isInUse',
    'needsCleaning',
    'isLost',
    'isBroken',
    'daysSinceLastUse',
    'daysSinceLastClean',
  ] as const),
  InputType
) {}

@InputType()
export class GlassCreateInput extends PartialType(
  OmitType(GlassUpdateInput, ['id'] as const),
  InputType
) {}
