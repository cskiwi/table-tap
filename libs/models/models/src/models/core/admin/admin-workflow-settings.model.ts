import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsArray, IsOptional, IsString } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Relation
} from 'typeorm';
import { AdminSettings } from './admin-settings.model';

@ObjectType('AdminWorkflowSettings')
@Entity('AdminWorkflowSettings')
@Index(['adminSettingsId'], { unique: true })
export class AdminWorkflowSettings extends BaseEntity {
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
  declare adminSettingsId: string;

  @OneToOne(() => AdminSettings, settings => settings.workflowSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adminSettingsId' })
  declare adminSettings: Relation<AdminSettings>;

  // Workflow settings
  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare defaultSteps: string[];

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare autoProgressEnabled: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: true })
  @IsBoolean()
  @IsOptional()
  declare requireStaffAssignment: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare stepCompletionAction: string; // 'notify' | 'auto-progress' | 'none'
}
