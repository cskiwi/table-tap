import { SortableField, WhereField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Relation
} from 'typeorm';
import { AdminNotification } from './admin-notification.model';

@ObjectType('AdminNotificationData')
@Entity('AdminNotificationData')
@Index(['notificationId'], { unique: true })
export class AdminNotificationData extends BaseEntity {
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
  declare notificationId: string;

  @OneToOne(() => AdminNotification, notification => notification.data, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notificationId' })
  declare notification: Relation<AdminNotification>;

  // Common notification data fields
  @WhereField({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare orderId: string;

  @WhereField({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare employeeId: string;

  @WhereField({ nullable: true })
  @Column('uuid', { nullable: true })
  @IsString()
  @IsOptional()
  declare stockId: string;

  @WhereField({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @IsOptional()
  declare amount: number;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare priority: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true, default: false })
  @IsBoolean()
  @IsOptional()
  declare requiresAction: boolean;

  @SortableField({ nullable: true })
  @WhereField({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare expiresAt: Date;

  // Flexible additional data as text
  @WhereField({ nullable: true })
  @Column('text', { nullable: true })
  @IsString()
  @IsOptional()
  declare additionalInfo: string;
}
