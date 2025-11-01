import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
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
import { Cafe } from '../cafe/cafe.model';
import { User } from '../user/user.model';
import { AdminWorkflowSettings } from './admin-workflow-settings.model';
import { AdminReportingSettings } from './admin-reporting-settings.model';
import { AdminDisplaySettings } from './admin-display-settings.model';

@ObjectType('AdminSettings')
@Entity('AdminSettings')
@Index(['cafeId'], { unique: true })
export class AdminSettings extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Multi-tenant support (one settings record per cafe)
  @Field()
  @Column('uuid')
  declare cafeId: string;

  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // General Settings
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare businessName: string;

  @Field()
  @Column({ default: 'UTC' })
  @IsString()
  declare timezone: string;

  @Field()
  @Column({ default: 'USD' })
  @IsString()
  declare currency: string;

  @Field()
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  @IsNumber()
  declare taxRate: number;

  @Field()
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  @IsNumber()
  declare serviceCharge: number;

  @Field()
  @Column({ default: 'en-US' })
  @IsString()
  declare locale: string;

  // Operations Settings
  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare autoAssignOrders: boolean;

  @Field()
  @Column('int', { default: 30 })
  @IsNumber()
  declare orderTimeout: number;

  @Field()
  @Column('int', { default: 10 })
  @IsNumber()
  declare maxOrdersPerCustomer: number;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare enableQualityControl: boolean;

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare enableInventoryTracking: boolean;

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare requirePaymentConfirmation: boolean;

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare allowCancellations: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare enableLoyaltyProgram: boolean;

  // Notification Settings
  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare emailEnabled: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare smsEnabled: boolean;

  @Field()
  @Column({ default: true })
  @IsBoolean()
  declare pushEnabled: boolean;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare criticalAlertsOnly: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare notificationEmail: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare notificationPhone: string;

  @Field()
  @Column('int', { default: 10 })
  @IsNumber()
  declare lowStockThreshold: number;

  @Field()
  @Column('int', { default: 30 })
  @IsNumber()
  declare orderDelayThreshold: number;

  // Integration Settings
  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  declare paymentProviders: string[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare inventorySystem: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare accountingSystem: string;

  @Field({ nullable: true })
  @Column('simple-array', { nullable: true })
  declare deliveryProviders: string[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare posSystem: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare paymentGateway: string;

  // Advanced Settings (replaced JSON columns with relationships)
  @OneToOne(() => AdminWorkflowSettings, settings => settings.adminSettings, { cascade: true })
  declare workflowSettings: Relation<AdminWorkflowSettings>;

  @OneToOne(() => AdminReportingSettings, settings => settings.adminSettings, { cascade: true })
  declare reportingSettings: Relation<AdminReportingSettings>;

  @OneToOne(() => AdminDisplaySettings, settings => settings.adminSettings, { cascade: true })
  declare displaySettings: Relation<AdminDisplaySettings>;

  // Audit tracking
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare lastUpdatedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'lastUpdatedByUserId' })
  declare lastUpdatedByUser: Relation<User>;

  // Computed fields
  @Field()
  get hasEmailNotifications(): boolean {
    return this.emailEnabled && !!this.notificationEmail;
  }

  @Field()
  get hasSmsNotifications(): boolean {
    return this.smsEnabled && !!this.notificationPhone;
  }

  @Field()
  get hasIntegrations(): boolean {
    return !!(
      this.paymentProviders?.length ||
      this.deliveryProviders?.length ||
      this.inventorySystem ||
      this.accountingSystem
    );
  }

  @Field()
  get effectiveTaxRate(): number {
    return this.taxRate / 100;
  }

  @Field()
  get effectiveServiceCharge(): number {
    return this.serviceCharge / 100;
  }
}
