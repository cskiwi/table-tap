import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import GraphQLJSONObject from 'graphql-type-json';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { ConfigurationValidation } from './configuration-validation.model';
import { ConfigurationUIOptions } from './configuration-ui-options.model';
import { Cafe } from '../cafe';
import { User } from '../user';

@ObjectType('Configuration')
@Entity('Configurations')
@Index(['cafeId', 'key'], { unique: true })
export class Configuration extends BaseEntity {
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

  @ManyToOne(() => Cafe, (cafe) => cafe.configurations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Configuration identification
  @Field()
  @Column()
  @IsString()
  declare key: string; // e.g., 'order_workflow', 'payment_methods', 'tax_rate'

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare category: string; // e.g., 'order', 'payment', 'inventory', 'ui', 'notifications'

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare displayName: string; // Human-readable name

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare description: string;

  // Configuration value
  @Field(() => GraphQLJSONObject)
  @Column('json')
  @IsObject()
  declare value: any; // The actual configuration value

  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column('json', { nullable: true })
  @IsObject()
  @IsOptional()
  declare defaultValue: any; // Default value for reference

  // Data type and validation
  @Field()
  @Column({ default: 'object' })
  @IsString()
  declare dataType: string; // 'string', 'number', 'boolean', 'array', 'object'

  @OneToOne(() => ConfigurationValidation, (validation) => validation.configuration, { cascade: true, nullable: true })
  declare validation: Relation<ConfigurationValidation>;

  // Access control
  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare isActive: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isReadOnly: boolean; // Cannot be modified through UI

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isSystem: boolean; // System configuration, hidden from regular users

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare requiresRestart: boolean; // Changes require app restart

  // UI hints
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare inputType: string; // 'text', 'textarea', 'select', 'checkbox', 'number', 'color', 'json'

  @OneToOne(() => ConfigurationUIOptions, (uiOptions) => uiOptions.configuration, { cascade: true, nullable: true })
  declare uiOptions: Relation<ConfigurationUIOptions>;

  // Change tracking
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare lastModifiedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'lastModifiedById' })
  declare lastModifiedBy: Relation<User>;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column('json', { nullable: true })
  @IsObject()
  @IsOptional()
  declare previousValue: any; // Previous value for audit trail

  // Grouping and ordering
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare group: string; // For grouping related configurations

  @Field()
  @Column({ default: 0 })
  declare sortOrder: number;

  // Computed fields
  @Field()
  get isDefault(): boolean {
    return JSON.stringify(this.value) === JSON.stringify(this.defaultValue);
  }

  @Field()
  get hasChanged(): boolean {
    return this.previousValue != null && JSON.stringify(this.value) !== JSON.stringify(this.previousValue);
  }

  @Field()
  get canEdit(): boolean {
    return this.isActive && !this.isReadOnly;
  }

  @Field()
  get displayValue(): string {
    if (this.dataType === 'boolean') {
      return this.value ? 'Enabled' : 'Disabled';
    }
    if (this.dataType === 'array' && Array.isArray(this.value)) {
      return this.value.join(', ');
    }
    if (this.dataType === 'object') {
      return JSON.stringify(this.value, null, 2);
    }
    return String(this.value);
  }

  // Common configuration examples:
  // key: 'order_workflow_steps'
  // value: ['confirmed', 'preparing', 'ready', 'delivered']

  // key: 'payment_methods'
  // value: ['cash', 'card', 'qr', 'credits']

  // key: 'tax_rate'
  // value: 0.18

  // key: 'service_charge'
  // value: { enabled: true, percentage: 10, applyToTakeaway: false }

  // key: 'glass_tracking_enabled'
  // value: true

  // key: 'order_number_format'
  // value: { prefix: 'ORD', padding: 4, startNumber: 1 }

  // key: 'receipt_footer'
  // value: 'Thank you for visiting our cafe!'

  // key: 'notification_settings'
  // value: {
  //   newOrder: { email: true, sms: false, push: true },
  //   lowStock: { email: true, sms: true, push: false },
  //   paymentFailed: { email: true, sms: false, push: true }
  // }

  // key: 'business_hours'
  // value: {
  //   monday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
  //   tuesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
  //   // ... other days
  // }

  // key: 'inventory_reorder_settings'
  // value: {
  //   autoReorder: false,
  //   reorderThresholdPercentage: 20,
  //   emailNotifications: true,
  //   defaultSupplier: 'supplier-uuid'
  // }
}