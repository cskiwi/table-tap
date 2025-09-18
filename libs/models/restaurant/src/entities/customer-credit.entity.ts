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
import { User } from '@app/models';
import { Cafe } from './cafe.entity';
import { CreditTransactionType } from '../enums/credit-transaction-type.enum';

@ObjectType('CustomerCredit')
@Entity('CustomerCredits')
@Index(['customerId', 'cafeId'])
export class CustomerCredit extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare amount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  declare balance: number;

  @Field(() => CreditTransactionType)
  @Column({
    type: 'enum',
    enum: CreditTransactionType,
  })
  declare transactionType: CreditTransactionType;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare description: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare referenceId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare expiresAt: Date;

  @SortableField()
  @Column()
  @Index()
  declare customerId: string;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  // Relations
  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  declare customer: User;

  @Field(() => Cafe)
  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;
}