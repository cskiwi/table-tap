import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Payment } from './payment.model';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType('PaymentMetadata')
@Entity('PaymentMetadata')
@Index(['paymentId'], { unique: true })
export class PaymentMetadata extends BaseEntity {
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
  declare paymentId: string;

  @OneToOne(() => Payment, (payment) => payment.metadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  declare payment: Relation<Payment>;

  // Verification tracking
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare verificationResult: string; // JSON string of verification data

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare verifiedAt: Date;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare verificationError: string;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastVerificationAttempt: Date;

  // Error tracking
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare error: string;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare errorOccurredAt: Date;

  // Refund tracking
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare refundErrorMessage: string;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare refundAttemptedAt: Date;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare refundAttemptedAmount: number;

  // Webhook tracking
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare webhookId: string;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare webhookReceivedAt: Date;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare webhookPayload: string; // JSON string

  // Request context
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare ipAddress: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare userAgent: string;

  // Gateway specific data
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare gatewayResponse: string; // JSON string of gateway response

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare gatewayTransactionId: string;

  // Custom tracking fields
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare processingSource: string; // 'api', 'webhook', 'manual', 'scheduled'

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare retryCount: number;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare lastRetryAt: Date;

  // Audit trail (keeping as JSON since it's a log of multiple events)
  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column('json', { nullable: true })
  @IsOptional()
  declare auditTrail: Array<{
    action: string;
    timestamp: Date;
    userId?: string;
    previousStatus?: string;
    newStatus?: string;
    metadata?: Record<string, any>;
  }>;
}
