import { SortableField } from '@app/utils';
import { CertificationStatus } from '@app/models/enums';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsBoolean, IsDate, IsArray } from 'class-validator';
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../employee.model';

@ObjectType('CertificationRecord')
@Entity('certification_records')
@Index(['employeeId', 'status'])
@Index(['expiryDate'])
export class CertificationRecord extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  // Employee relationship
  @Field()
  @Column('uuid')
  @Index()
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  // Certification details
  @Field()
  @Column('varchar', { length: 255 })
  @IsString()
  declare certificationName: string;

  @Field()
  @Column('varchar', { length: 255 })
  @IsString()
  declare certificationBody: string;

  @Field()
  @Column('timestamp')
  @IsDate()
  declare issueDate: Date;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  @IsDate()
  @IsOptional()
  declare expiryDate?: Date;

  @Field()
  @Column('varchar', { length: 255 })
  @IsString()
  declare certificateNumber: string;

  // Status tracking
  @Field(() => CertificationStatus)
  @Column('enum', {
    enum: CertificationStatus,
    default: CertificationStatus.ACTIVE,
  })
  @IsEnum(CertificationStatus)
  declare status: CertificationStatus;

  @Field()
  @Column('boolean', { default: false })
  @IsBoolean()
  declare renewalRequired: boolean;

  @Field()
  @Column('boolean', { default: false })
  @IsBoolean()
  declare renewalReminderSent: boolean;

  // Skills and attachments
  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  declare skillsValidated?: string[];

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare attachmentUrl?: string;

  // Computed fields
  @Field()
  get isActive(): boolean {
    return this.status === CertificationStatus.ACTIVE;
  }

  @Field()
  get isExpired(): boolean {
    if (!this.expiryDate) return false;
    return this.expiryDate < new Date();
  }

  @Field()
  get isExpiringSoon(): boolean {
    if (!this.expiryDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.expiryDate <= thirtyDaysFromNow && this.expiryDate > new Date();
  }
}

