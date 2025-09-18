import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Float, Int } from '@nestjs/graphql';
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
import { Employee } from './employee.entity';

@ObjectType('TimeSheet')
@Entity('TimeSheets')
@Index(['employeeId', 'date'])
export class TimeSheet extends BaseEntity {
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
  @Column({ type: 'date' })
  @Index()
  declare date: string;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare clockIn: Date;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare clockOut: Date;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare totalMinutes: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare breakMinutes: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare overtimeMinutes: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare regularHours: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  declare overtimeHours: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  declare notes: string;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare isApproved: boolean;

  @SortableField()
  @Column()
  @Index()
  declare employeeId: string;

  // Relations
  @Field(() => Employee)
  @ManyToOne(() => Employee, (employee) => employee.timeSheets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;
}