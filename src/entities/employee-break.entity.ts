import { SortableField } from '@app/utils';
import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
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
import { EmployeeShift } from './employee-shift.entity';
import { BreakType } from '../enums/break-type.enum';

@ObjectType('EmployeeBreak')
@Entity('EmployeeBreaks')
@Index(['shiftId', 'type'])
export class EmployeeBreak extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @Field(() => BreakType)
  @Column({
    type: 'enum',
    enum: BreakType,
  })
  declare type: BreakType;

  @SortableField()
  @Column()
  declare scheduledStart: Date;

  @Field(() => Int)
  @Column()
  declare scheduledDuration: number; // in minutes

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare actualStart: Date;

  @SortableField({ nullable: true })
  @Column({ nullable: true })
  declare actualEnd: Date;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  declare actualDuration: number; // in minutes

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  declare location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  };

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  declare notes: string;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare isCompleted: boolean;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ default: false })
  declare isPaid: boolean; // Some breaks are paid, some unpaid

  @SortableField()
  @Column()
  @Index()
  declare shiftId: string;

  // Relations
  @Field(() => EmployeeShift)
  @ManyToOne(() => EmployeeShift, (shift) => shift.breaks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shiftId' })
  declare shift: EmployeeShift;

  // Computed fields
  @Field(() => Boolean)
  get isOverdue(): boolean {
    if (!this.actualStart || this.isCompleted) return false;
    const expectedEnd = new Date(this.actualStart.getTime() + this.scheduledDuration * 60000);
    return new Date() > expectedEnd;
  }

  @Field(() => Int, { nullable: true })
  get overdueMinutes(): number {
    if (!this.isOverdue) return 0;
    const expectedEnd = new Date(this.actualStart.getTime() + this.scheduledDuration * 60000);
    const diffMs = new Date().getTime() - expectedEnd.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  @Field(() => Boolean)
  get isLate(): boolean {
    if (!this.actualStart) return false;
    return this.actualStart > this.scheduledStart;
  }

  @Field(() => Int, { nullable: true })
  get lateMinutes(): number {
    if (!this.isLate) return 0;
    const diffMs = this.actualStart.getTime() - this.scheduledStart.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }
}