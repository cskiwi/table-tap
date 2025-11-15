import { SortableField, WhereField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsBoolean } from 'class-validator';
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
import { DayOfWeek } from '@app/models/enums';
import { Cafe } from './cafe.model';

@ObjectType('CafeBusinessHours')
@Entity('CafeBusinessHours')
@Index(['cafeId', 'dayOfWeek'], { unique: true })
export class CafeBusinessHours extends BaseEntity {
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
  declare cafeId: string;

  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // Day and hours
  @SortableField(() => DayOfWeek)
  @WhereField(() => DayOfWeek)
  @Column('enum', { enum: DayOfWeek })
  declare dayOfWeek: DayOfWeek;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare isOpen: boolean;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  declare openTime: string; // Format: "HH:MM" e.g., "09:00"

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  declare closeTime: string; // Format: "HH:MM" e.g., "17:00"
}
