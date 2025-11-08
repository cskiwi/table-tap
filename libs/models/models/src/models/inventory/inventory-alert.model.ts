import { SortableField } from '@app/utils';
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
  OneToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { AlertSeverity, AlertType } from '@app/models/enums';
import { Stock } from './stock.model';
import { InventoryAlertMetadata } from './inventory-alert-metadata.model';
import { Cafe, User } from '../core';

@ObjectType('InventoryAlert')
@Entity('InventoryAlerts')
@Index(['cafeId', 'resolved'])
@Index(['cafeId', 'severity'])
@Index(['cafeId', 'type'])
export class InventoryAlert extends BaseEntity {
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
  declare cafe: Relation<Cafe>;

  // Stock relationship
  @Field()
  @Column('uuid')
  @Index()
  declare stockId: string;

  @ManyToOne(() => Stock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockId' })
  declare stock: Relation<Stock>;

  // Alert details
  @Field(() => AlertType)
  @Column('enum', { enum: AlertType })
  @IsEnum(AlertType)
  declare type: AlertType;

  @Field(() => AlertSeverity)
  @Column('enum', { enum: AlertSeverity })
  @IsEnum(AlertSeverity)
  declare severity: AlertSeverity;

  @Field()
  @Column()
  @IsString()
  declare title: string;

  @Field()
  @Column('text')
  @IsString()
  declare message: string;

  // Stock information snapshot
  @Field()
  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  declare currentStock: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare minimumStock: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare reorderLevel: number;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare expiryDate: Date;

  // Item identification
  @Field()
  @Column()
  @IsString()
  declare itemName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare sku: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare category: string;

  // Alert status
  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare resolved: boolean;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare resolvedAt: Date;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare resolvedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolvedByUserId' })
  declare resolvedByUser: Relation<User>;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare resolutionNotes: string;

  // Action tracking
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare actionUrl: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare actionLabel: string;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare acknowledged: boolean;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare acknowledgedAt: Date;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare acknowledgedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'acknowledgedByUserId' })
  declare acknowledgedByUser: Relation<User>;

  // Additional metadata
  @OneToOne(() => InventoryAlertMetadata, (metadata) => metadata.alert, { cascade: true })
  declare metadata: Relation<InventoryAlertMetadata>;

  // Computed fields
  @Field()
  get isActive(): boolean {
    return !this.resolved && !this.deletedAt;
  }

  @Field()
  get isCritical(): boolean {
    return this.severity === AlertSeverity.CRITICAL;
  }

  @Field()
  get requiresImmediateAction(): boolean {
    return !this.acknowledged && this.severity === AlertSeverity.CRITICAL;
  }

  @Field(() => Number, { nullable: true })
  get daysUntilExpiry(): number | null {
    if (!this.expiryDate) return null;
    const now = new Date();
    const diff = this.expiryDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
