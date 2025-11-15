import { SortableField, WhereField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsArray, IsOptional, IsString, IsNumber } from 'class-validator';
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

@ObjectType('AdminReportingSettings')
@Entity('AdminReportingSettings')
@Index(['adminSettingsId'], { unique: true })
export class AdminReportingSettings extends BaseEntity {
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
  declare adminSettingsId: string;

  @OneToOne(() => AdminSettings, settings => settings.reportingSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adminSettingsId' })
  declare adminSettings: Relation<AdminSettings>;

  // Reporting settings
  @WhereField({ nullable: true })
  @Column({ nullable: true, default: '09:00' })
  @IsString()
  @IsOptional()
  declare dailyReportTime: string; // Format: "HH:MM"

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: 'monday' })
  @IsString()
  @IsOptional()
  declare weeklyReportDay: string; // 'monday' | 'sunday' etc.

  @WhereField({ nullable: true })
  @Column('int', { nullable: true, default: 1 })
  @IsNumber()
  @IsOptional()
  declare monthlyReportDay: number; // 1-28

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare autoGenerateReports: boolean;

  @WhereField(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare reportRecipients: string[]; // Email addresses

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: true })
  @IsBoolean()
  @IsOptional()
  declare includeSalesReport: boolean;

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: true })
  @IsBoolean()
  @IsOptional()
  declare includeInventoryReport: boolean;

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare includeEmployeeReport: boolean;
}
