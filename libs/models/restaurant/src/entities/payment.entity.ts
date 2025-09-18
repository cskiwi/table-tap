import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Float } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

@ObjectType('Payment')
@Entity('Payments')
@Index(['orderId', 'status'])
@Index(['transactionId'], { unique: true })
export class Payment extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @SortableField()
  @Column({ unique: true })
  @Index()
  declare transactionId: string;

  @Field(() => PaymentMethod)
  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  declare method: PaymentMethod;

  @Field(() => PaymentStatus)
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  declare status: PaymentStatus;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare amount: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare currency: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare processorTransactionId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare processorResponse: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare processedAt: Date;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare metadata: Record<string, any>;

  @SortableField()
  @Column()
  @Index()
  declare orderId: string;

  // Relations
  @Field(() => Order)
  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  declare order: Order;
}