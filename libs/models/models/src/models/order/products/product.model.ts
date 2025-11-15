import { SortableField, WhereField } from '@app/utils';
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
  @WhereField()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, (cafe) => cafe.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Product Information
  @SortableField()
  @WhereField()
  @Column()
  @IsString()
  @Index({ fulltext: true })
  declare name: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare description: string;

  @SortableField({ nullable: true })
  @WhereField({ nullable: true })
  @Column({ unique: true, nullable: true })
  @IsString()
  @IsOptional()
  @Index({ unique: true, where: '"sku" IS NOT NULL' })
  declare sku: string;

  @SortableField(() => ProductCategory)
  @WhereField(() => ProductCategory)
  @Column('enum', { enum: ProductCategory })
  @IsEnum(ProductCategory)
  declare category: ProductCategory;

  @SortableField(() => ProductStatus)
  @WhereField(() => ProductStatus)
  @Column('enum', { enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsEnum(ProductStatus)
  declare status: ProductStatus;

  // Pricing
  @SortableField()
  @WhereField()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare basePrice: number;

  @SortableField({ nullable: true })
  @WhereField({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountPrice: number;

  @WhereField({ nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare taxRate: number;

  // Display
  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare image: string;

  @WhereField()
  @Column({ default: true })
  @IsBoolean()
  declare isAvailable: boolean;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare isFeatured: boolean;

  @SortableField()
  @WhereField()
  @Column({ default: 0 })
  @IsNumber()
  declare sortOrder: number;

  // Inventory tracking
  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare trackInventory: boolean;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare stockQuantity: number;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  declare minStockLevel: number;

  // Product properties
  @OneToOne(() => ProductAttribute, (attributes) => attributes.product, { cascade: true })
  declare attributes: Relation<ProductAttribute>;

  @WhereField(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare tags: string[];

  // Counter routing
  @WhereField(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare countersRequired: string[]; // Counter IDs that need to process this product

  @WhereField({ nullable: true })
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
