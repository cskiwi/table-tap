import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Order } from './order.entity';
import { Counter } from './counter.entity';
import { Employee } from './employee.entity';
import { Inventory } from './inventory.entity';
import { CafeStatus } from '../enums/cafe-status.enum';

@ObjectType('Cafe')
@Entity('Cafes')
@Index(['name', 'location'])
export class Cafe extends BaseEntity {
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
  @Column()
  @Index({ unique: true })
  declare name: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare description: string;

  @SortableField()
  @Column()
  @Index()
  declare location: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare address: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare phone: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare email: string;

  @Field(() => CafeStatus)
  @Column({
    type: 'enum',
    enum: CafeStatus,
    default: CafeStatus.ACTIVE,
  })
  declare status: CafeStatus;

  @SortableField({ nullable: true })
  @Column({ type: 'time', nullable: true })
  declare openTime: string;

  @SortableField({ nullable: true })
  @Column({ type: 'time', nullable: true })
  declare closeTime: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare settings: Record<string, any>;

  // Relations
  @Field(() => [Menu], { nullable: true })
  @OneToMany(() => Menu, (menu) => menu.cafe, { cascade: true })
  declare menus: Menu[];

  @Field(() => [Order], { nullable: true })
  @OneToMany(() => Order, (order) => order.cafe)
  declare orders: Order[];

  @Field(() => [Counter], { nullable: true })
  @OneToMany(() => Counter, (counter) => counter.cafe, { cascade: true })
  declare counters: Counter[];

  @Field(() => [Employee], { nullable: true })
  @OneToMany(() => Employee, (employee) => employee.cafe)
  declare employees: Employee[];

  @Field(() => [Inventory], { nullable: true })
  @OneToMany(() => Inventory, (inventory) => inventory.cafe)
  declare inventory: Inventory[];
}