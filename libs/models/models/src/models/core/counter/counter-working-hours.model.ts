import { SortableField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsString, IsEnum } from 'class-validator';
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
  Relation,
} from 'typeorm';
import { Counter } from './counter.model';
import { DayOfWeek } from '@app/models/enums';

@ObjectType('CounterWorkingHours')
@Entity('CounterWorkingHours')
@Index(['counterId', 'dayOfWeek'], { unique: true })
export class CounterWorkingHours extends BaseEntity {
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
  @Index()
  declare counterId: string;

  @ManyToOne(() => Counter, (counter) => counter.workingHours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'counterId' })
  declare counter: Relation<Counter>;

  // Day and hours
  @Field(() => DayOfWeek)
  @Column('enum', { enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  declare dayOfWeek: DayOfWeek;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isOpen: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  declare startTime: string; // Format: "HH:MM" e.g., "09:00"

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  declare endTime: string; // Format: "HH:MM" e.g., "17:00"
}
