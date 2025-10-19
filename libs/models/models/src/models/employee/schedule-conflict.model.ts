import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ScheduledShift } from './scheduled-shift.model';
import { ScheduleConflictType } from '@app/models/enums';

@Entity('schedule_conflicts')
export class ScheduleConflict {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column('uuid')
  declare shiftId: string;

  @ManyToOne(() => ScheduledShift, { nullable: false })
  @JoinColumn({ name: 'shiftId' })
  declare shift: ScheduledShift;

  @Column({
    type: 'enum',
    enum: ScheduleConflictType
  })
  declare type: ScheduleConflictType;

  @Column('varchar', { length: 255 })
  declare description: string;

  @Column('varchar', { length: 50 })
  declare severity: string;

  @Column('boolean', { default: false })
  declare resolved: boolean;

  @CreateDateColumn()
  declare createdAt: Date;
}
