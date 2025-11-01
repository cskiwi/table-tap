import { PermGuard, ReqUser } from '@app/backend-authorization';
import { AdminNotification, User } from '@app/models';
import { NotificationType, NotificationSeverity } from '@app/models/enums';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Repository } from 'typeorm';

@Injectable()
@Resolver('AdminNotification')
export class AdminNotificationsResolver {
  private readonly logger = new Logger(AdminNotificationsResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(AdminNotification)
    private readonly notificationRepository: Repository<AdminNotification>,
  ) {}

  @Query('adminNotifications')
  @UseGuards(PermGuard)
  async adminNotifications(
    @Args('cafeId') cafeId: string,
    @Args('unreadOnly') unreadOnly?: boolean,
    @Args('limit') limit?: number,
    @ReqUser() user?: User,
  ): Promise<AdminNotification[]> {
    try {
      const queryBuilder = this.notificationRepository.createQueryBuilder('notification').where('notification.cafeId = :cafeId', { cafeId });

      if (unreadOnly) {
        queryBuilder.andWhere('notification.read = :read', { read: false });
      }

      return await queryBuilder
        .orderBy('notification.createdAt', 'DESC')
        .limit(limit || 50)
        .getMany();
    } catch (error) {
      this.logger.error(`Failed to fetch notifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation('markNotificationRead')
  @UseGuards(PermGuard)
  async markNotificationRead(@Args('id') id: string, @ReqUser() user?: User): Promise<AdminNotification> {
    try {
      const notification = await this.notificationRepository.findOneOrFail({
        where: { id },
      });

      notification.read = true;
      notification.readAt = new Date();

      return await this.notificationRepository.save(notification);
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Mutation('markAllNotificationsRead')
  @UseGuards(PermGuard)
  async markAllNotificationsRead(@Args('cafeId') cafeId: string, @ReqUser() user?: User): Promise<boolean> {
    try {
      await this.notificationRepository
        .createQueryBuilder()
        .update()
        .set({ read: true, readAt: new Date() })
        .where('cafeId = :cafeId', { cafeId })
        .andWhere('read = :read', { read: false })
        .execute();

      return true;
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Subscription('adminNotificationCreated', {
    filter: (payload, variables) => {
      if (variables.cafeId) {
        return payload.adminNotificationCreated.cafeId === variables.cafeId;
      }
      return true;
    },
  })
  adminNotificationCreated(@Args('cafeId') cafeId: string) {
    return this.pubSub.asyncIterator('adminNotificationCreated');
  }

  async createNotification(
    cafeId: string,
    type: NotificationType,
    severity: NotificationSeverity,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<AdminNotification> {
    const notification = this.notificationRepository.create({
      cafeId,
      type,
      severity,
      title,
      message,
      read: false,
    });

    // If metadata is provided, create the data relation
    if (metadata) {
      notification.data = {
        additionalInfo: JSON.stringify(metadata)
      } as any;
    }

    const saved = await this.notificationRepository.save(notification);

    await this.pubSub.publish('adminNotificationCreated', {
      adminNotificationCreated: saved,
    });

    return saved;
  }
}
