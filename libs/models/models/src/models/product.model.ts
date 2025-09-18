import { SortableField } from '@app/utils';
import { ProductCategory, ProductStatus } from '@app/enum';
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
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Cafe } from './cafe.model';
import { OrderItem } from './order-item.model';
import { Stock } from './stock.model';

@ObjectType('Product')
@Entity('Products')
@Index(['cafeId', 'category'])
@Index(['name'])
@Index(['sku'])
@Index(['status'])
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

  @ManyToOne(() => Cafe, cafe => cafe.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

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
  @Index({ unique: true, where: 'sku IS NOT NULL' })
  declare sku: string;

  @Field()
  @Column('enum', { enum: ProductCategory })
  @IsEnum(ProductCategory)
  declare category: ProductCategory;

  @Field()
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
  @Field({ nullable: true })
  @Column('json', { nullable: true })
  @IsOptional()
  declare attributes: {
    size?: string[];
    temperature?: string[];
    milkType?: string[];
    sweetness?: string[];
    extras?: string[];
    allergens?: string[];
    nutritionInfo?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  };

  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare tags: string[];

  // Counter routing
  @Field({ nullable: true })
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
  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  declare orderItems: OrderItem[];

  @OneToMany(() => Stock, stock => stock.product)
  declare stockItems: Stock[];

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