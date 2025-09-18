import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Cafe } from './cafe.entity';
import { Order } from './order.entity';
import { Employee } from './employee.entity';
import { CounterStatus } from '../enums/counter-status.enum';

@ObjectType('Counter')
@Entity('Counters')
@Index(['cafeId', 'number'])
export class Counter extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field(() => Int)
  @Column()
  @Index()
  declare number: number;

  @SortableField()
  @Column()
  declare name: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare description: string;

  @Field(() => CounterStatus)
  @Column({
    type: 'enum',
    enum: CounterStatus,
    default: CounterStatus.ACTIVE,
  })
  declare status: CounterStatus;

  @Field(() => Int, { defaultValue: 0 })
  @Column({ default: 0 })
  declare maxOrders: number;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare settings: Record<string, any>;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  // Relations
  @Field(() => Cafe)
  @ManyToOne(() => Cafe, (cafe) => cafe.counters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  @Field(() => [Order], { nullable: true })
  @OneToMany(() => Order, (order) => order.counter)
  declare orders: Order[];

  @Field(() => [Employee], { nullable: true })
  @OneToMany(() => Employee, (employee) => employee.assignedCounter)
  declare assignedEmployees: Employee[];
}