import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsNumber, IsString, IsArray, IsOptional } from 'class-validator';
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
import { Configuration } from './configuration.model';

@ObjectType('ConfigurationValidation')
@Entity('ConfigurationValidation')
@Index(['configurationId'], { unique: true })
export class ConfigurationValidation extends BaseEntity {
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
  declare configurationId: string;

  @OneToOne(() => Configuration, config => config.validation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'configurationId' })
  declare configuration: Relation<Configuration>;

  // Validation rules
  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare required: boolean;

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare minLength: number;

  @Field({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare maxLength: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 20, scale: 10, nullable: true })
  @IsNumber()
  @IsOptional()
  declare min: number;

  @Field({ nullable: true })
  @Column('decimal', { precision: 20, scale: 10, nullable: true })
  @IsNumber()
  @IsOptional()
  declare max: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare pattern: string; // Regex pattern

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare enumValues: string[]; // Allowed enum values

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare schema: string; // JSON schema as text for complex objects
}
