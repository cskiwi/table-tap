import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray } from 'class-validator';
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
import { Cafe } from './cafe.model';

@ObjectType('CafeSettings')
@Entity('CafeSettings')
@Index(['cafeId'], { unique: true })
export class CafeSettings extends BaseEntity {
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
  declare cafeId: string;

  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // General settings
  @Field({ nullable: true })
  @Column({ nullable: true, default: 'USD' })
  @IsString()
  @IsOptional()
  declare currency: string;

  @Field({ nullable: true })
  @Column({ nullable: true, default: 'UTC' })
  @IsString()
  @IsOptional()
  declare timezone: string;

  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  @IsNumber()
  @IsOptional()
  declare taxRate: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  @IsNumber()
  @IsOptional()
  declare serviceCharge: number;

  // Feature flags
  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare enableGlassTracking: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare enableCredits: boolean;

  // Workflow settings
  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare workflowSteps: string[];

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare paymentMethods: string[];

  // Order settings
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare orderPrefix: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare receiptFooter: string;
}
