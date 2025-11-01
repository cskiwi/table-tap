import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CertificationStatus } from '@app/models/enums';
import { Employee } from '../employee.model';

@Entity('certification_records')
export class CertificationRecord {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid')
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Column('varchar', { length: 255 })
  declare certificationName: string;

  @Column('varchar', { length: 255 })
  declare certificationBody: string;

  @Column('timestamp')
  declare issueDate: Date;

  @Column('timestamp', { nullable: true })
  declare expiryDate?: Date;

  @Column('varchar', { length: 255 })
  declare certificateNumber: string;

  @Column({
    type: 'enum',
    enum: CertificationStatus,
    default: CertificationStatus.ACTIVE
  })
  declare status: CertificationStatus;

  @Column('boolean', { default: false })
  declare renewalRequired: boolean;

  @Column('boolean', { default: false })
  declare renewalReminderSent: boolean;

  @Column('simple-array', { nullable: true })
  declare skillsValidated?: string[];

  @Column('text', { nullable: true })
  declare attachmentUrl?: string;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
