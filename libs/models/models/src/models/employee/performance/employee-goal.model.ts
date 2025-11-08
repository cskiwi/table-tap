import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsDate, IsArray, IsObject } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from '../employee.model';
import { User } from '../../core';

@ObjectType('EmployeeGoal')
@Entity('employee_goals')
@Index(['employeeId', 'status'])
@Index(['targetDate'])
export class EmployeeGoal extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Employee relationship
  @Field()
  @Column('uuid')
  @Index()
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  // Goal details
  @Field()
  @Column('varchar', { length: 255 })
  @IsString()
  declare title: string;

  @Field()
  @Column('text')
  @IsString()
  declare description: string;

  @Field()
  @Column('varchar', { length: 50 })
  @IsString()
  declare category: string;

  @Field()
  @Column('timestamp')
  @IsDate()
  declare targetDate: Date;

  @Field()
  @Column('varchar', { length: 50 })
  @IsString()
  declare status: string;

  @Field()
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  @IsNumber()
  declare progress: number;

  // Assignment tracking
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare assignedBy?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedBy' })
  declare assigner?: User;

  // Milestones
  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column('jsonb', { nullable: true })
  @IsArray()
  @IsOptional()
  declare milestones?: Array<{
    title: string;
    completed: boolean;
    completedDate?: Date;
  }>;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes?: string;

  // Computed fields
  @Field()
  get isComplete(): boolean {
    return this.progress >= 100 || this.status === 'COMPLETED';
  }

  @Field()
  get isOverdue(): boolean {
    return this.targetDate < new Date() && !this.isComplete;
  }

  @Field(() => Number)
  get completedMilestones(): number {
    if (!this.milestones) return 0;
    return this.milestones.filter(m => m.completed).length;
  }

  @Field(() => Number)
  get totalMilestones(): number {
    return this.milestones?.length || 0;
  }
}

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType()
export class EmployeeGoalUpdateInput extends PartialType(
  OmitType(EmployeeGoal, [
    'createdAt',
    'updatedAt',
    'employee',
    'assigner',
    'isComplete',
    'isOverdue',
    'completedMilestones',
    'totalMilestones',
  ] as const),
  InputType,
) {}

@InputType()
export class EmployeeGoalCreateInput extends PartialType(OmitType(EmployeeGoalUpdateInput, ['id'] as const), InputType) {}
