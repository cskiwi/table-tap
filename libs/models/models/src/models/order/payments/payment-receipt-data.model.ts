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

@ObjectType('PaymentReceiptData')
@Entity('PaymentReceiptData')
@Index(['paymentId'], { unique: true })
export class PaymentReceiptData extends BaseEntity {
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

  @OneToOne(() => Payment, payment => payment.receiptData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  declare payment: Relation<Payment>;

  // Receipt details
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare customerEmail: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare customerPhone: string;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare printedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare emailedAt: Date;
}
