import { SortableField, WhereField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  Relation
} from 'typeorm';
import { Counter } from './counter.model';

@ObjectType('CounterCapabilities')
@Entity('CounterCapabilities')
@Index(['counterId'], { unique: true })
export class CounterCapabilities extends BaseEntity {
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
  @WhereField()
  @Column('uuid')
  declare counterId: string;

  @OneToOne(() => Counter, counter => counter.capabilities, { onDelete: 'CASCADE' })
  declare counter: Relation<Counter>;

  // Capability flags
  @WhereField({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare canAcceptOrders: boolean;

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare canProcessPayments: boolean;

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare canPrintReceipts: boolean;

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare canManageInventory: boolean;

  // Supported features
  @WhereField(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare supportedPaymentMethods: string[];

  @WhereField(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare supportedOrderTypes: string[];

  @WhereField({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare printerConfig: string; // JSON string for printer configuration
}
