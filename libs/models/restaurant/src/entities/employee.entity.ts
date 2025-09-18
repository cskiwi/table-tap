import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Float } from '@nestjs/graphql';
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
import { User } from '@app/models';
import { Cafe } from './cafe.entity';
import { Counter } from './counter.entity';
import { TimeSheet } from './time-sheet.entity';
import { EmployeeRole } from '../enums/employee-role.enum';
import { EmployeeStatus } from '../enums/employee-status.enum';

@ObjectType('Employee')
@Entity('Employees')
@Index(['cafeId', 'userId'])
export class Employee extends BaseEntity {
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
  declare employeeId: string;

  @Field(() => EmployeeRole)
  @Column({
    type: 'enum',
    enum: EmployeeRole,
  })
  declare role: EmployeeRole;

  @Field(() => EmployeeStatus)
  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  declare status: EmployeeStatus;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  declare hourlyRate: number;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare hireDate: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare department: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare permissions: string[];

  @SortableField()
  @Column()
  @Index()
  declare userId: string;

  @SortableField()
  @Column()
  @Index()
  declare cafeId: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  @Index()
  declare assignedCounterId: string;

  // Relations
  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  declare user: User;

  @Field(() => Cafe)
  @ManyToOne(() => Cafe, (cafe) => cafe.employees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Cafe;

  @Field(() => Counter, { nullable: true })
  @ManyToOne(() => Counter, (counter) => counter.assignedEmployees, { nullable: true })
  @JoinColumn({ name: 'assignedCounterId' })
  declare assignedCounter: Counter;

  @Field(() => [TimeSheet], { nullable: true })
  @OneToMany(() => TimeSheet, (timeSheet) => timeSheet.employee)
  declare timeSheets: TimeSheet[];
}