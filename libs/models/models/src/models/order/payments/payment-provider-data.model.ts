import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';
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
  Relation
} from 'typeorm';
import { Payment } from './payment.model';

@ObjectType('PaymentProviderData')
@Entity('PaymentProviderData')
@Index(['paymentId'], { unique: true })
export class PaymentProviderData extends BaseEntity {
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

  @OneToOne(() => Payment, payment => payment.providerData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  declare payment: Relation<Payment>;

  // Payconic specific
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare qrCode: string;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare qrExpiry: Date;

  // Card specific
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare last4: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare cardType: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare authCode: string;

  // Mobile specific
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare walletType: string;

  // Generic provider response
  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare providerResponse: string; // JSON string for flexible data storage
}
