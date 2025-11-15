import { SortableField, WhereField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';
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
import { Employee } from './employee.model';

@ObjectType('EmployeeEmergencyContact')
@Entity('EmployeeEmergencyContact')
@Index(['employeeId'], { unique: true })
export class EmployeeEmergencyContact extends BaseEntity {
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
  declare employeeId: string;

  @OneToOne(() => Employee, employee => employee.emergencyContact, { onDelete: 'CASCADE' })
  declare employee: Relation<Employee>;

  // Contact information
  @SortableField()
  @WhereField()
  @Column()
  @IsString()
  declare name: string;

  @WhereField()
  @Column()
  @IsString()
  declare relationship: string;

  @WhereField()
  @Column()
  @IsPhoneNumber()
  declare phone: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsPhoneNumber()
  @IsOptional()
  declare alternatePhone: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsEmail()
  @IsOptional()
  declare email: string;

  @WhereField({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare address: string;
}
