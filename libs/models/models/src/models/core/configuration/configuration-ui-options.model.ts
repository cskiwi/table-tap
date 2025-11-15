import { SortableField, WhereField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsNumber, IsString, IsOptional } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Relation
} from 'typeorm';
import { Configuration } from './configuration.model';
import { ConfigurationUIOption } from './configuration-ui-option.model';

@ObjectType('ConfigurationUIOptions')
@Entity('ConfigurationUIOptions')
@Index(['configurationId'], { unique: true })
export class ConfigurationUIOptions extends BaseEntity {
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
  declare configurationId: string;

  @OneToOne(() => Configuration, config => config.uiOptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'configurationId' })
  declare configuration: Relation<Configuration>;

  // UI hints
  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare placeholder: string;

  @WhereField({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare helpText: string;

  @WhereField({ nullable: true })
  @Column('int', { nullable: true })
  @IsNumber()
  @IsOptional()
  declare rows: number; // for textarea

  @WhereField({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare step: number; // for number input

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare multiselect: boolean; // for select

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare sortable: boolean; // for arrays

  // Options for select/radio inputs
  @OneToMany(() => ConfigurationUIOption, option => option.uiOptions, { cascade: true })
  declare options: Relation<ConfigurationUIOption[]>;
}
