import { SortableField, WhereField } from '@app/utils';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Cafe } from '../cafe/cafe.model';
import { User } from '../user/user.model';
import { AdminNotificationData } from './admin-notification-data.model';
import { NotificationSeverity, NotificationType } from '@app/models/enums';

@ObjectType('AdminNotification')
@Entity('AdminNotifications')
@Index(['cafeId', 'read'])
@Index(['cafeId', 'type'])
@Index(['cafeId', 'severity'])
@Index(['userId', 'read'])
export class AdminNotification extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @SortableField()
  @CreateDateColumn()
  declare createdAt: Date;

  @SortableField({ nullable: true })
  @UpdateDateColumn({ nullable: true })
  declare updatedAt: Date;

  @SortableField({ nullable: true })
  @DeleteDateColumn({ nullable: true })
  declare deletedAt: Date;

  // Multi-tenant support
  @WhereField()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // User relationship (optional - can be broadcast to all admins)
  @WhereField({ nullable: true })
  @Column('uuid', { nullable: true })
  @Index()
  declare userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  declare user: Relation<User>;

  // Notification details
  @SortableField(() => NotificationType)
  @WhereField(() => NotificationType)
  @Column('enum', { enum: NotificationType })
  @IsEnum(NotificationType)
  declare type: NotificationType;

  @SortableField(() => NotificationSeverity)
  @WhereField(() => NotificationSeverity)
  @Column('enum', { enum: NotificationSeverity, default: NotificationSeverity.INFO })
  @IsEnum(NotificationSeverity)
  declare severity: NotificationSeverity;

  @WhereField()
  @Column()
  @IsString()
  declare title: string;

  @WhereField()
  @Column('text')
  @IsString()
  declare message: string;

  // Read status
  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare read: boolean;

  @SortableField({ nullable: true })
  @WhereField({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare readAt: Date;

  // Action details
  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare actionUrl: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare actionLabel: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare actionType: string; // 'VIEW', 'APPROVE', 'DISMISS', 'NAVIGATE'

  // Source tracking
  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare sourceId: string;

  @WhereField({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare sourceType: string;

  // Additional metadata
  @OneToOne(() => AdminNotificationData, data => data.notification, { cascade: true })
  declare data: Relation<AdminNotificationData>;

  // Delivery status
  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare emailSent: boolean;

  @SortableField({ nullable: true })
  @WhereField({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare emailSentAt: Date;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare smsSent: boolean;

  @SortableField({ nullable: true })
  @WhereField({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare smsSentAt: Date;

  @WhereField()
  @Column({ default: false })
  @IsBoolean()
  declare pushSent: boolean;

  @SortableField({ nullable: true })
  @WhereField({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare pushSentAt: Date;

  // Expiration
  @SortableField({ nullable: true })
  @WhereField({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare expiresAt: Date;

  // Computed fields
  @Field()
  get isUnread(): boolean {
    return !this.read;
  }

  @Field()
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  @Field()
  get isCritical(): boolean {
    return this.severity === NotificationSeverity.CRITICAL;
  }

  @Field()
  get requiresAction(): boolean {
    return !!this.actionUrl && !this.read;
  }

  @Field()
  get age(): number {
    return Math.floor((new Date().getTime() - this.createdAt.getTime()) / 1000);
  }
}
