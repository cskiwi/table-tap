import { SortableField } from '@app/utils';
import { StockMovementType } from '@app/enum';
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
  OneToMany
} from 'typeorm';
import { Cafe } from './cafe.model';
import { Product } from './product.model';
import { User } from './user.model';

@ObjectType('StockMovement')
@Entity('StockMovements')
@Index(['cafeId', 'productId'])
@Index(['productId', 'movementType'])
@Index(['createdAt'])
export class StockMovement extends BaseEntity {
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

  @ManyToOne(() => Product, product => product.stockItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  declare product: Product;

  // Movement details
  @Field()
  @Column('enum', { enum: StockMovementType })
  @IsEnum(StockMovementType)
  declare movementType: StockMovementType;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare quantity: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare previousQuantity: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare newQuantity: number;

  // Cost information
  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare unitCost: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare totalCost: number;

  // Reference information
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare referenceId: string; // Order ID, Purchase ID, etc.

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare referenceType: string; // 'order', 'purchase', 'adjustment'

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare reason: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  // User who made the movement
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare performedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performedById' })
  declare performedBy: User;

  // Batch/lot tracking
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare batchNumber: string;

  @Field({ nullable: true })
  @Column('date', { nullable: true })
  declare expiryDate: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare supplier: string;

  // Computed fields
  @Field()
  get isIncrease(): boolean {
    return [StockMovementType.PURCHASE, StockMovementType.RETURN, StockMovementType.ADJUSTMENT].includes(this.movementType) && this.quantity > 0;
  }

  @Field()
  get isDecrease(): boolean {
    return [StockMovementType.SALE, StockMovementType.WASTE, StockMovementType.TRANSFER].includes(this.movementType) ||
           (this.movementType === StockMovementType.ADJUSTMENT && this.quantity < 0);
  }

  @Field()
  get absoluteQuantity(): number {
    return Math.abs(this.quantity);
  }
}

@ObjectType('Stock')
@Entity('Stock')
@Index(['cafeId', 'productId'], { unique: true })
@Index(['productId'])
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

  @ManyToOne(() => Product, product => product.stockItems, { onDelete: 'CASCADE' })
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
  @OneToMany(() => StockMovement, movement => movement.product)
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