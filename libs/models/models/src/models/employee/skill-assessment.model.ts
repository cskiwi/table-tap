import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from './employee.model';
import { User } from '../core/user.model';

@Entity('skill_assessments')
export class SkillAssessment {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid')
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Column('varchar', { length: 255 })
  declare skillName: string;

  @Column('varchar', { length: 50 })
  declare category: string;

  @Column('integer', { nullable: true })
  declare currentLevel?: number;

  @Column('integer', { nullable: true })
  declare targetLevel?: number;

  @Column('timestamp')
  declare assessmentDate: Date;

  @Column('uuid', { nullable: true })
  declare assessedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assessedBy' })
  declare assessor?: User;

  @Column('text', { nullable: true })
  declare notes?: string;

  @Column('timestamp', { nullable: true })
  declare nextReviewDate?: Date;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
