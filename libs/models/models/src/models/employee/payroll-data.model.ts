import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from './employee.model';

@Entity('payroll_data')
export class PayrollData {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid')
  declare employeeId: string;

  @ManyToOne(() => Employee, { nullable: false })
  @JoinColumn({ name: 'employeeId' })
  declare employee: Employee;

  @Column('timestamp')
  declare payPeriodStart: Date;

  @Column('timestamp')
  declare payPeriodEnd: Date;

  // Hours breakdown
  @Column('decimal', { precision: 10, scale: 2 })
  declare regularHours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare overtimeHours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare doubleTimeHours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare holidayHours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare sickHours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare vacationHours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare personalHours: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare bereavementHours: number;

  // Pay calculations
  @Column('decimal', { precision: 10, scale: 2 })
  declare regularPay: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare overtimePay: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare doubleTimePay: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare holidayPay: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare bonuses: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare commissions: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare tips: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare allowances: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare grossPay: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare netPay: number;

  // Taxes (stored as JSONB for flexibility)
  @Column('jsonb')
  declare taxes: {
    federal: number;
    state: number;
    local: number;
    socialSecurity: number;
    medicare: number;
    sui: number; // State Unemployment Insurance
    sdi: number; // State Disability Insurance
  };

  // Benefits (stored as JSONB for flexibility)
  @Column('jsonb')
  declare benefits: {
    healthInsurance: number;
    dentalInsurance: number;
    visionInsurance: number;
    lifeInsurance: number;
    retirement401k: number;
    retirementMatch: number;
    flexSpending: number;
    parking: number;
    other: number;
  };

  // Other deductions
  @Column('decimal', { precision: 10, scale: 2 })
  declare garnishments: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare loanRepayments: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare advanceRepayments: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare uniformCosts: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare equipmentCosts: number;

  // YTD totals
  @Column('decimal', { precision: 10, scale: 2 })
  declare ytdGrossPay: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare ytdTaxes: number;

  @Column('decimal', { precision: 10, scale: 2 })
  declare ytdNetPay: number;

  @CreateDateColumn()
  declare createdAt: Date;

  @UpdateDateColumn()
  declare updatedAt: Date;
}
