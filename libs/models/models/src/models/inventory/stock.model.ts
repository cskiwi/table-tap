import { SortableField } from '@app/utils';
import { StockMovementType } from '@app/models/enums';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
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
import { Cafe } from '../core/cafe.model';
import { Product } from '../order/product.model';
import { User } from '../core/user.model';
import { StockMovement } from './stock-movement.model';

@ObjectType('Stock')
@Entity('Stock')
@Index(['cafeId', 'productId'], { unique: true })
export class Stock extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Multi-tenant support
  @Field()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  // Product relationship
  @Field()
  @Column('uuid')
  @Index()
  declare productId: string;

  @ManyToOne(() => Product, (product) => product.stockItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  declare product: Product;

  // Current stock level
  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare currentQuantity: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare reservedQuantity: number; // Quantity reserved for pending orders

  // Stock management settings
  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare minLevel: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare maxLevel: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare reorderLevel: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @IsNumber()
  declare reorderQuantity: number;

  // Cost tracking
  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare averageCost: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare lastCost: number;

  // Location and organization
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare location: string; // Storage location

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare unit: string; // kg, pieces, liters, etc.

  // Alerts and flags
  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isActive: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare lowStockAlert: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare outOfStockAlert: boolean;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastRestockedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastSoldAt: Date;

  // Relations
  @OneToMany(() => StockMovement, (movement) => movement.product)
  declare movements: StockMovement[];

  // Computed fields
  @Field()
  get availableQuantity(): number {
    return Math.max(0, this.currentQuantity - this.reservedQuantity);
  }

  @Field()
  get isLowStock(): boolean {
    return this.currentQuantity <= this.reorderLevel;
  }

  @Field()
  get isOutOfStock(): boolean {
    return this.currentQuantity <= 0;
  }

  @Field()
  get needsReorder(): boolean {
    return this.currentQuantity <= this.reorderLevel;
  }

  @Field()
  get stockValue(): number {
    return this.currentQuantity * (this.averageCost ?? 0);
  }

  @Field()
  get stockStatus(): string {
    if (this.isOutOfStock) return 'out_of_stock';
    if (this.isLowStock) return 'low_stock';
    if (this.currentQuantity >= this.maxLevel) return 'overstock';
    return 'in_stock';
  }
}
