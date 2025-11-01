import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber } from 'class-validator';
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
  Relation
} from 'typeorm';
import { Purchase } from './purchase.model';

@ObjectType('PurchaseItem')
@Entity('PurchaseItems')
export class PurchaseItem extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Purchase relationship
  @Field()
  @Column('uuid')
  @Index()
  declare purchaseId: string;

  @ManyToOne(() => Purchase, purchase => purchase.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseId' })
  declare purchase: Relation<Purchase>;

  // Product information (snapshot at time of purchase)
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare productId: string;

  @Field()
  @Column()
  @IsString()
  declare productName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare productSku: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare category: string;

  // Purchase details
  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare quantity: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare unitCost: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare totalCost: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare unit: string; // kg, pieces, liters, etc.

  // Quality and batch information
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare batchNumber: string;

  @Field({ nullable: true })
  @Column('date', { nullable: true })
  declare expiryDate: Date;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;
}

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class PurchaseItemUpdateInput extends PartialType(
  OmitType(PurchaseItem, [
    'createdAt',
    'updatedAt',
    'purchase',
  ] as const),
  InputType
) {}

@InputType()
export class PurchaseItemCreateInput extends PartialType(
  OmitType(PurchaseItemUpdateInput, ['id'] as const),
  InputType
) {}
