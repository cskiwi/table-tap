import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsObject, IsEnum } from 'class-validator';
import { PreparationStatus } from '@app/models/enums';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation
} from 'typeorm';
import { Order } from './order.model';
import { Product } from './product.model';

@ObjectType('OrderItem')
@Entity('OrderItems')
export class OrderItem extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Relations
  @Field()
  @Column('uuid')
  @Index()
  declare orderId: string;

  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  declare order: Relation<Order>;

  @Field()
  @Column('uuid')
  @Index()
  declare productId: string;

  @ManyToOne(() => Product, product => product.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  declare product: Relation<Product>;

  // Item details
  @Field()
  @Column()
  @IsNumber()
  declare quantity: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare unitPrice: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare totalPrice: number;

  // Product snapshot at time of order
  @Field()
  @Column()
  @IsString()
  declare productName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare productDescription: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare productSku: string;

  // Customizations and modifications
  @Field({ nullable: true })
  @Column('json', { nullable: true })
  @IsObject()
  @IsOptional()
  declare customizations: {
    size?: string;
    temperature?: string;
    milkType?: string;
    sweetness?: string;
    extras?: string[];
    removals?: string[];
  };

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare specialInstructions: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare allergiesNotes: string;

  // Pricing breakdown
  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare basePrice: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare customizationPrice: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountAmount: number;

  // Counter and preparation tracking
  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  declare countersRequired: string[]; // Counter IDs that need to process this item

  @Field({ nullable: true })
  @Column('json', { nullable: true })
  declare counterStatus: {
    counterId: string;
    status: 'pending' | 'in_progress' | 'completed';
    startedAt?: Date;
    completedAt?: Date;
  }[];

  // Preparation tracking
  @Field({ nullable: true })
  @Column('enum', { enum: PreparationStatus, default: PreparationStatus.PENDING, nullable: true })
  @IsEnum(PreparationStatus)
  @IsOptional()
  declare preparationStatus: PreparationStatus;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  @IsOptional()
  declare preparationStartTime: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  @IsOptional()
  declare preparationEndTime: Date;

  // Computed fields
  @Field()
  get hasCustomizations(): boolean {
    return this.customizations != null && Object.keys(this.customizations).length > 0;
  }

  @Field()
  get isCompleted(): boolean {
    if (!this.counterStatus?.length) return false;
    return this.counterStatus.every(cs => cs.status === 'completed');
  }

  @Field()
  get totalCustomizationPrice(): number {
    return this.customizationPrice ?? 0;
  }
}