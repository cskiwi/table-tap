import { PermGuard, ReqUser } from '@app/backend-authorization';
import { AdminNotification, User, Cafe } from '@app/models';
import { NotificationType, NotificationSeverity } from '@app/models/enums';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription, ResolveField, Parent } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Repository } from 'typeorm';
import { AdminNotificationArgs } from '../../args';

@Injectable()
@Resolver(() => AdminNotification)
export class AdminNotificationsResolver {
  private readonly logger = new Logger(AdminNotificationsResolver.name);
  private pubSub: any = new PubSub();

  constructor(
    @InjectRepository(AdminNotification)
    private readonly notificationRepository: Repository<AdminNotification>,
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Query(() => [AdminNotification], { name: 'adminNotifications' })
  @UseGuards(PermGuard)
  async adminNotifications(
    @Args('args', { type: () => AdminNotificationArgs, nullable: true })
    inputArgs?: InstanceType<typeof AdminNotificationArgs>,
    @ReqUser() user?: User,
  ): Promise<AdminNotification[]> {
    try {
      const args = AdminNotificationArgs.toFindManyOptions(inputArgs);
      return await this.notificationRepository.find(args);
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch notifications: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Mutation(() => AdminNotification, { name: 'markNotificationRead' })
  @UseGuards(PermGuard)
  async markNotificationRead(@Args('id') id: string, @ReqUser() user?: User): Promise<AdminNotification> {
    try {
      const notification = await this.notificationRepository.findOneOrFail({
        where: { id },
      });

      notification.read = true;
      notification.readAt = new Date();

      return await this.notificationRepository.save(notification);
    } catch (error: unknown) {
      this.logger.error(`Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Mutation(() => Boolean, { name: 'markAllNotificationsRead' })
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
    } catch (error: unknown) {
      this.logger.error(`Failed to mark all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // Field Resolvers - Use parent object when available, lazy load via ID when not
  @ResolveField(() => Cafe)
  async cafe(@Parent() notification: AdminNotification): Promise<Cafe> {
    if (notification.cafe) return notification.cafe;
    const cafe = await this.cafeRepository.findOne({ where: { id: notification.cafeId } });
    if (!cafe) throw new Error(`Cafe with ID ${notification.cafeId} not found`);
    return cafe;
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() notification: AdminNotification): Promise<User | null> {
    if (notification.user !== undefined) return notification.user;
    if (!notification.userId) return null;
    return this.userRepository.findOne({ where: { id: notification.userId } });
  }

  @Subscription(() => AdminNotification, {
    name: 'adminNotificationCreated',
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
