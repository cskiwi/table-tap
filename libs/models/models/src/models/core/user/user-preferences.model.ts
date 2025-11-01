import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  Relation
} from 'typeorm';
import { User } from './user.model';

@ObjectType('UserPreferences')
@Entity('UserPreferences')
@Index(['userId'], { unique: true })
export class UserPreferences extends BaseEntity {
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
  declare userId: string;

  @OneToOne(() => User, user => user.preferences, { onDelete: 'CASCADE' })
  declare user: Relation<User>;

  // Notification preferences
  @Field({ nullable: true })
  @Column({ nullable: true, default: true })
  declare emailNotifications: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: true })
  declare pushNotifications: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, default: false })
  declare smsNotifications: boolean;

  // Display preferences
  @Field({ nullable: true })
  @Column({ nullable: true, default: 'en' })
  @IsString()
  @IsOptional()
  declare language: string;

  @Field({ nullable: true })
  @Column({ nullable: true, default: 'light' })
  @IsString()
  @IsOptional()
  declare theme: string; // 'light' | 'dark' | 'auto'

  @Field({ nullable: true })
  @Column({ nullable: true, default: 'UTC' })
  @IsString()
  @IsOptional()
  declare timezone: string;
}
