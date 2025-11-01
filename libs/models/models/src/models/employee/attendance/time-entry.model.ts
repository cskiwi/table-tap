import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { TimeSheet } from './time-sheet.model';

@ObjectType('TimeEntry')
@Entity('TimeEntries')
export class TimeEntry extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  // TimeSheet relationship
  @Field()
  @Column('uuid')
  @Index()
  declare timeSheetId: string;

  @ManyToOne(() => TimeSheet, (timeSheet) => timeSheet.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'timeSheetId' })
  declare timeSheet: Relation<TimeSheet>;

  // Entry details
  @Field()
  @Column()
  @IsString()
  declare entryType: string; // 'clock_in', 'clock_out', 'break_start', 'break_end'

  @Field()
  @Column('timestamp')
  declare timestamp: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare location: string; // Where the entry was made

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare method: string; // 'manual', 'app', 'rfid', 'biometric'

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare notes: string;

  // GPS tracking (optional)
  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  @IsNumber()
  @IsOptional()
  declare latitude: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  @IsNumber()
  @IsOptional()
  declare longitude: number;

  // Verification and adjustments
  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isAdjusted: boolean;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare originalTimestamp: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare adjustmentReason: string;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  declare adjustedById: string;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare adjustedAt: Date;
}

// GraphQL Input Types
import { InputType, PartialType, OmitType } from '@nestjs/graphql';

@InputType()
export class TimeEntryUpdateInput extends PartialType(
  OmitType(TimeEntry, [
    'createdAt',
    'timeSheet',
  ] as const),
  InputType
) {}

@InputType()
export class TimeEntryCreateInput extends PartialType(
  OmitType(TimeEntryUpdateInput, ['id'] as const),
  InputType
) {}
