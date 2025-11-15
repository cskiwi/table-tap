import { SortableField, WhereField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber } from 'class-validator';
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
import { ConfigurationUIOptions } from './configuration-ui-options.model';

@ObjectType('ConfigurationUIOption')
@Entity('ConfigurationUIOption')
@Index(['uiOptionsId', 'sortOrder'])
export class ConfigurationUIOption extends BaseEntity {
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
  @Index()
  declare uiOptionsId: string;

  @ManyToOne(() => ConfigurationUIOptions, uiOptions => uiOptions.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uiOptionsId' })
  declare uiOptions: Relation<ConfigurationUIOptions>;

  // Option details
  @SortableField()
  @WhereField()
  @Column()
  @IsString()
  declare label: string;

  @WhereField()
  @Column('text')
  @IsString()
  declare value: string; // Stored as text, can be parsed based on configuration dataType

  @WhereField({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare description: string;

  @SortableField()
  @WhereField()
  @Column('int', { default: 0 })
  @IsNumber()
  declare sortOrder: number;
}
