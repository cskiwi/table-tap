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
  ManyToOne,
  JoinColumn,
  Relation
} from 'typeorm';
import { Glass } from './glass.model';
import { User } from '../core';
import { Order } from '../order';

@ObjectType('GlassMovement')
@Entity('GlassMovements')
export class GlassMovement extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  // Glass relationship
  @Field()
  @Column('uuid')
  @Index()
  declare glassId: string;

  @ManyToOne(() => Glass, glass => glass.movements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'glassId' })
  declare glass: Relation<Glass>;

  // Movement details
  @Field()
  @Column()
  @IsString()
  declare movementType: string; // 'issued', 'returned', 'lost', 'broken', 'cleaned'

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  declare order: Relation<Order>;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare customerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  declare customer: Relation<User>;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare employeeId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Relation<User>;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare location: string; // Where the movement occurred
}

