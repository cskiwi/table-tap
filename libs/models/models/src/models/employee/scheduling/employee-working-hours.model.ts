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
  Relation
} from 'typeorm';
import { Employee } from '../employee.model';
import { DayOfWeek } from '@app/models/enums';

@ObjectType('EmployeeWorkingHours')
@Entity('EmployeeWorkingHours')
@Index(['employeeId', 'dayOfWeek'], { unique: true })
export class EmployeeWorkingHours extends BaseEntity {
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
  declare employeeId: string;

  @ManyToOne(() => Employee, employee => employee.workingHours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Relation<Employee>;

  // Day and hours
  @Field()
  @Column('enum', { enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  declare dayOfWeek: DayOfWeek;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare isWorking: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  declare startTime: string; // Format: "HH:MM" e.g., "09:00"

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  declare endTime: string; // Format: "HH:MM" e.g., "17:00"
}
