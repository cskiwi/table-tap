import { SortableField } from '@app/utils';
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
  @Field()
  @Column('uuid')
  @Index()
  declare cafeId: string;

  @ManyToOne(() => Cafe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cafeId' })
  declare cafe: Relation<Cafe>;

  // User relationship (optional - can be broadcast to all admins)
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  @Index()
  declare userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  declare user: Relation<User>;

  // Notification details
  @Field(() => NotificationType)
  @Column('enum', { enum: NotificationType })
  @IsEnum(NotificationType)
  declare type: NotificationType;

  @Field(() => NotificationSeverity)
  @Column('enum', { enum: NotificationSeverity, default: NotificationSeverity.INFO })
  @IsEnum(NotificationSeverity)
  declare severity: NotificationSeverity;

  @Field()
  @Column()
  @IsString()
  declare title: string;

  @Field()
  @Column('text')
  @IsString()
  declare message: string;

  // Read status
  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare read: boolean;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare readAt: Date;

  // Action details
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare actionUrl: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare actionLabel: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare actionType: string; // 'VIEW', 'APPROVE', 'DISMISS', 'NAVIGATE'

  // Source tracking
  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare sourceId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  declare sourceType: string;

  // Additional metadata
  @OneToOne(() => AdminNotificationData, data => data.notification, { cascade: true })
  declare data: Relation<AdminNotificationData>;

  // Delivery status
  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare emailSent: boolean;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare emailSentAt: Date;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare smsSent: boolean;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare smsSentAt: Date;

  @Field()
  @Column({ default: false })
  @IsBoolean()
  declare pushSent: boolean;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  declare pushSentAt: Date;

  // Expiration
  @Field({ nullable: true })
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
