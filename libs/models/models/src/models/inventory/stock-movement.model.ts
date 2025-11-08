import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { StockMovementType } from '@app/models/enums';
import { Cafe, User } from '../core';
import { Product } from '../order';

@ObjectType('StockMovement')
@Entity('StockMovements')
@Index(['cafeId', 'productId'])
@Index(['productId', 'movementType'])
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
  declare cafe: Relation<Cafe>;

  // Product relationship
  @Field()
  @Column('uuid')
  @Index()
  declare productId: string;

  @ManyToOne(() => Product, (product) => product.stockItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  declare product: Relation<Product>;

  // Movement details
  @Field(() => StockMovementType)
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
  declare performedBy: Relation<User>;

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
    return (
      [StockMovementType.SALE, StockMovementType.WASTE, StockMovementType.TRANSFER].includes(this.movementType) ||
      (this.movementType === StockMovementType.ADJUSTMENT && this.quantity < 0)
    );
  }

  @Field()
  get absoluteQuantity(): number {
    return Math.abs(this.quantity);
  }
}

