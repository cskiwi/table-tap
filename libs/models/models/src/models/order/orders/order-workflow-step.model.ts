import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsEnum, IsOptional } from 'class-validator';
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
  Relation
} from 'typeorm';
import { WorkflowStepStatus } from '@app/models/enums';
import { Order } from './order.model';

@ObjectType('OrderWorkflowStep')
@Entity('OrderWorkflowSteps')
@Index(['orderId', 'stepName'])
@Index(['orderId', 'status'])
export class OrderWorkflowStep extends BaseEntity {
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
  @Index()
  declare orderId: string;

  @ManyToOne(() => Order, order => order.workflowSteps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  declare order: Relation<Order>;

  // Workflow step details
  @Field()
  @Column()
  @IsString()
  declare stepName: string;

  @Field(() => WorkflowStepStatus)
  @Column('enum', { enum: WorkflowStepStatus, default: WorkflowStepStatus.PENDING })
  @IsEnum(WorkflowStepStatus)
  declare status: WorkflowStepStatus;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare assignedCounterId: string;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare startedAt: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare completedAt: Date;

  @Field()
  @Column('int', { default: 0 })
  declare sortOrder: number; // To maintain step order
}
