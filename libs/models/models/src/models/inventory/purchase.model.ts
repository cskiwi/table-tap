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
  OneToMany
} from 'typeorm';
import { Cafe } from '../core/cafe.model';
import { User } from '../core/user.model';
import { PurchaseItem } from './purchase-item.model';

@ObjectType('Purchase')
@Entity('Purchases')
@Index(['cafeId', 'purchaseNumber'])
export class Purchase extends BaseEntity {
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

  // Purchase identification
  @Field()
  @Column({ unique: true })
  @IsString()
  @Index({ unique: true })
  declare purchaseNumber: string; // e.g., "PO-2024-001"

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare supplierInvoiceNumber: string;

  // Supplier information
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare supplierId: string; // Reference to supplier (could be separate entity)

  @Field()
  @Column()
  @IsString()
  declare supplierName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare supplierEmail: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare supplierPhone: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare supplierAddress: string;

  // Order details
  @Field()
  @Column('date')
  declare orderDate: Date;

  @Field({ nullable: true })
  @Column('date', { nullable: true })
  declare expectedDeliveryDate: Date;

  @Field({ nullable: true })
  @Column('date', { nullable: true })
  declare actualDeliveryDate: Date;

  @Field()
  @Column({ default: 'pending' })
  @IsString()
  declare status: string; // 'pending', 'ordered', 'delivered', 'cancelled', 'partial'

  // Financial information
  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare subtotal: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare taxAmount: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare taxRate: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare shippingCost: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare discountAmount: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare totalAmount: number;

  // Payment tracking
  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isPaid: boolean;

  @Field({ nullable: true })
  @Column('date', { nullable: true })
  declare paidDate: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare paymentMethod: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare paymentReference: string;

  // User relationships
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  declare createdBy: User;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare approvedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  declare approvedBy: User;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare approvedAt: Date;

  // Additional information
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare deliveryInstructions: string;

  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  declare attachments: string[]; // File paths/URLs to invoices, receipts, etc.

  // Relations
  @OneToMany(() => PurchaseItem, item => item.purchase, { cascade: true })
  declare items: PurchaseItem[];

  // Computed fields
  @Field()
  get isComplete(): boolean {
    return this.status === 'delivered';
  }

  @Field()
  get isPending(): boolean {
    return ['pending', 'ordered'].includes(this.status);
  }

  @Field()
  get isOverdue(): boolean {
    if (!this.expectedDeliveryDate || this.isComplete) return false;
    return new Date() > this.expectedDeliveryDate;
  }

  @Field()
  get itemCount(): number {
    return this.items?.length ?? 0;
  }

  @Field()
  get totalQuantity(): number {
    return this.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }
}
