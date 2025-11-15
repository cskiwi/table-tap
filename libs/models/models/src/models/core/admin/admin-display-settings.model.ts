import { SortableField, WhereField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
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

@ObjectType('AdminDisplaySettings')
@Entity('AdminDisplaySettings')
@Index(['adminSettingsId'], { unique: true })
export class AdminDisplaySettings extends BaseEntity {
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

  @OneToOne(() => AdminSettings, settings => settings.displaySettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adminSettingsId' })
  declare adminSettings: Relation<AdminSettings>;

  // Display settings
  @WhereField({ nullable: true })
  @Column({ nullable: true, default: 'light' })
  @IsString()
  @IsOptional()
  declare theme: string; // 'light' | 'dark' | 'auto'

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: '#3B82F6' })
  @IsString()
  @IsOptional()
  declare primaryColor: string; // Hex color code

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: '#10B981' })
  @IsString()
  @IsOptional()
  declare secondaryColor: string; // Hex color code

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare logoUrl: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: true })
  @IsBoolean()
  @IsOptional()
  declare showBranding: boolean;

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: 'Roboto' })
  @IsString()
  @IsOptional()
  declare fontFamily: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: 'comfortable' })
  @IsString()
  @IsOptional()
  declare density: string; // 'compact' | 'comfortable' | 'spacious'
}
