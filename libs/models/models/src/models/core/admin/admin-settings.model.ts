import { SortableField, WhereField } from '@app/utils';
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
  @WhereField()
  @Column('uuid')
  declare cafeId: string;

  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // General Settings
  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare businessName: string;

  @WhereField()
  @Column({ default: 'UTC' })
  @IsString()
  declare timezone: string;

  @WhereField()
  @Column({ default: 'USD' })
  @IsString()
  declare currency: string;

  @WhereField()
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  @IsNumber()
  declare taxRate: number;

  @WhereField()
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  @IsNumber()
  declare serviceCharge: number;

  @WhereField()
  @Column({ default: 'en-US' })
  @IsString()
  declare locale: string;

  // Operations Settings
  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare autoAssignOrders: boolean;

  @WhereField()
  @Column('int', { default: 30 })
  @IsNumber()
  declare orderTimeout: number;

  @WhereField()
  @Column('int', { default: 10 })
  @IsNumber()
  declare maxOrdersPerCustomer: number;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare enableQualityControl: boolean;

  @WhereField()
  @Column({ default: true })
  @IsBoolean()
  declare enableInventoryTracking: boolean;

  @WhereField()
  @Column({ default: true })
  @IsBoolean()
  declare requirePaymentConfirmation: boolean;

  @WhereField()
  @Column({ default: true })
  @IsBoolean()
  declare allowCancellations: boolean;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare enableLoyaltyProgram: boolean;

  // Notification Settings
  @WhereField()
  @Column({ default: true })
  @IsBoolean()
  declare emailEnabled: boolean;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare smsEnabled: boolean;

  @WhereField()
  @Column({ default: true })
  @IsBoolean()
  declare pushEnabled: boolean;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare criticalAlertsOnly: boolean;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare notificationEmail: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare notificationPhone: string;

  @WhereField()
  @Column('int', { default: 10 })
  @IsNumber()
  declare lowStockThreshold: number;

  @WhereField()
  @Column('int', { default: 30 })
  @IsNumber()
  declare orderDelayThreshold: number;

  // Integration Settings
  @WhereField(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  declare paymentProviders: string[];

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare inventorySystem: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare accountingSystem: string;

  @WhereField(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  declare deliveryProviders: string[];

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare posSystem: string;

  @WhereField({ nullable: true })
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
  @WhereField({ nullable: true })
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

  @Field(() => Boolean)
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
