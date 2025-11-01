import { SortableField } from '@app/utils';
import { ProductCategory, ProductStatus } from '@app/models/enums';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsArray } from 'class-validator';
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

import { ProductAttribute } from './product-attribute.model';
import { Cafe } from '../../core';
import { Stock } from '../../inventory';
import { OrderItem } from '../orders';

@ObjectType('Product')
@Entity('Products')
@Index(['cafeId', 'category'])
export class Product extends BaseEntity {
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

  @ManyToOne(() => Cafe, (cafe) => cafe.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Product Information
  @Field()
  @Column()
  @IsString()
  @Index({ fulltext: true })
  declare name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare description: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  @IsString()
  @IsOptional()
  @Index({ unique: true, where: '"sku" IS NOT NULL' })
  declare sku: string;

  @Field(() => ProductCategory)
  @Column('enum', { enum: ProductCategory })
  @IsEnum(ProductCategory)
  declare category: ProductCategory;

  @Field(() => ProductStatus)
  @Column('enum', { enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsEnum(ProductStatus)
  declare status: ProductStatus;

  // Pricing
  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare basePrice: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountPrice: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare taxRate: number;

  // Display
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare image: string;

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isAvailable: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isFeatured: boolean;

  @Field()
  @Column({ default: 0 })
  @IsNumber()
  declare sortOrder: number;

  // Inventory tracking
  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare trackInventory: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare stockQuantity: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare minStockLevel: number;

  // Product properties
  @OneToOne(() => ProductAttribute, attributes => attributes.product, { cascade: true })
  declare attributes: Relation<ProductAttribute>;

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare tags: string[];

  // Counter routing
  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare countersRequired: string[]; // Counter IDs that need to process this product

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare preparationTime: number; // in minutes

  // Relations
  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  declare orderItems: Relation<OrderItem[]>;

  @OneToMany(() => Stock, (stock) => stock.product)
  declare stockItems: Relation<Stock[]>;

  // Computed fields
  @Field()
  get finalPrice(): number {
    return this.discountPrice ?? this.basePrice;
  }

  @Field()
  get isOnSale(): boolean {
    return this.discountPrice != null && this.discountPrice < this.basePrice;
  }

  @Field()
  get isInStock(): boolean {
    if (!this.trackInventory) return true;
    return this.stockQuantity != null && this.stockQuantity > 0;
  }

  @Field()
  get needsRestock(): boolean {
    if (!this.trackInventory || !this.minStockLevel) return false;
    return this.stockQuantity != null && this.stockQuantity <= this.minStockLevel;
  }
}

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class ProductUpdateInput extends PartialType(
  OmitType(Product, [
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'attributes',
    'orderItems',
    'stockItems',
    'finalPrice',
    'isOnSale',
    'isInStock',
    'needsRestock',
  ] as const),
  InputType
) {}

@InputType()
export class ProductCreateInput extends PartialType(
  OmitType(ProductUpdateInput, ['id'] as const),
  InputType
) {}
