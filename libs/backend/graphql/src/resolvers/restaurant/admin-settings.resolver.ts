import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, AdminSettings } from '@app/models';

@Injectable()
@Resolver('AdminSettings')
export class AdminSettingsResolver {
  private readonly logger = new Logger(AdminSettingsResolver.name);

  constructor(
    @InjectRepository(AdminSettings)
    private readonly settingsRepository: Repository<AdminSettings>,
  ) {}

  @Query('adminSettings')
  @UseGuards(PermGuard)
  async adminSettings(
    @Args('cafeId') cafeId: string,
    @ReqUser() user?: User,
  ): Promise<any> {
    try {
      let settings = await this.settingsRepository.findOne({
        where: { cafeId },
      });

      if (!settings) {
        settings = await this.createDefaultSettings(cafeId);
      }

      return this.formatSettings(settings);
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch admin settings: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Mutation('updateAdminSettings')
  @UseGuards(PermGuard)
  async updateAdminSettings(
    @Args('cafeId') cafeId: string,
    @Args('input') input: any,
    @ReqUser() user?: User,
  ): Promise<any> {
    try {
      let settings = await this.settingsRepository.findOne({
        where: { cafeId },
      });

      if (!settings) {
        settings = this.settingsRepository.create({ cafeId });
      }

      if (input.general) {
        settings.businessName = input.general.businessName ?? settings.businessName;
        settings.timezone = input.general.timezone ?? settings.timezone;
        settings.currency = input.general.currency ?? settings.currency;
        settings.taxRate = input.general.taxRate ?? settings.taxRate;
        settings.serviceCharge = input.general.serviceCharge ?? settings.serviceCharge;
        settings.locale = input.general.locale ?? settings.locale;
      }

      if (input.operations) {
        settings.autoAssignOrders = input.operations.autoAssignOrders ?? settings.autoAssignOrders;
        settings.orderTimeout = input.operations.orderTimeout ?? settings.orderTimeout;
        settings.maxOrdersPerCustomer = input.operations.maxOrdersPerCustomer ?? settings.maxOrdersPerCustomer;
        settings.enableQualityControl = input.operations.enableQualityControl ?? settings.enableQualityControl;
        settings.enableInventoryTracking = input.operations.enableInventoryTracking ?? settings.enableInventoryTracking;
        settings.requirePaymentConfirmation = input.operations.requirePaymentConfirmation ?? settings.requirePaymentConfirmation;
        settings.allowCancellations = input.operations.allowCancellations ?? settings.allowCancellations;
        settings.enableLoyaltyProgram = input.operations.enableLoyaltyProgram ?? settings.enableLoyaltyProgram;
      }

      if (input.notifications) {
        settings.emailEnabled = input.notifications.emailEnabled ?? settings.emailEnabled;
        settings.smsEnabled = input.notifications.smsEnabled ?? settings.smsEnabled;
        settings.pushEnabled = input.notifications.pushEnabled ?? settings.pushEnabled;
        settings.criticalAlertsOnly = input.notifications.criticalAlertsOnly ?? settings.criticalAlertsOnly;
        settings.notificationEmail = input.notifications.notificationEmail ?? settings.notificationEmail;
        settings.notificationPhone = input.notifications.notificationPhone ?? settings.notificationPhone;
        settings.lowStockThreshold = input.notifications.lowStockThreshold ?? settings.lowStockThreshold;
        settings.orderDelayThreshold = input.notifications.orderDelayThreshold ?? settings.orderDelayThreshold;
      }

      if (input.integrations) {
        settings.paymentProviders = input.integrations.paymentProviders ?? settings.paymentProviders;
        settings.inventorySystem = input.integrations.inventorySystem ?? settings.inventorySystem;
        settings.accountingSystem = input.integrations.accountingSystem ?? settings.accountingSystem;
        settings.deliveryProviders = input.integrations.deliveryProviders ?? settings.deliveryProviders;
        settings.posSystem = input.integrations.posSystem ?? settings.posSystem;
        settings.paymentGateway = input.integrations.paymentGateway ?? settings.paymentGateway;
      }

      if (user?.id) {
        settings.lastUpdatedByUserId = user.id;
      }

      const saved = await this.settingsRepository.save(settings);
      return this.formatSettings(saved);
    } catch (error: unknown) {
      this.logger.error(`Failed to update admin settings: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  private async createDefaultSettings(cafeId: string): Promise<AdminSettings> {
    const settings = this.settingsRepository.create({
      cafeId,
      businessName: 'My Cafe',
      timezone: 'UTC',
      currency: 'USD',
      taxRate: 0,
      serviceCharge: 0,
      locale: 'en-US',
      autoAssignOrders: false,
      orderTimeout: 30,
      maxOrdersPerCustomer: 10,
      enableQualityControl: false,
      enableInventoryTracking: true,
      requirePaymentConfirmation: true,
      allowCancellations: true,
      enableLoyaltyProgram: false,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      criticalAlertsOnly: false,
      lowStockThreshold: 10,
      orderDelayThreshold: 30,
      paymentProviders: [],
      deliveryProviders: [],
    });

    return await this.settingsRepository.save(settings);
  }

  private formatSettings(settings: AdminSettings): any {
    return {
      general: {
        businessName: settings.businessName,
        timezone: settings.timezone,
        currency: settings.currency,
        taxRate: settings.taxRate,
        serviceCharge: settings.serviceCharge,
        locale: settings.locale,
      },
      operations: {
        autoAssignOrders: settings.autoAssignOrders,
        orderTimeout: settings.orderTimeout,
        maxOrdersPerCustomer: settings.maxOrdersPerCustomer,
        enableQualityControl: settings.enableQualityControl,
        enableInventoryTracking: settings.enableInventoryTracking,
        requirePaymentConfirmation: settings.requirePaymentConfirmation,
        allowCancellations: settings.allowCancellations,
        enableLoyaltyProgram: settings.enableLoyaltyProgram,
      },
      notifications: {
        emailEnabled: settings.emailEnabled,
        smsEnabled: settings.smsEnabled,
        pushEnabled: settings.pushEnabled,
        criticalAlertsOnly: settings.criticalAlertsOnly,
        notificationEmail: settings.notificationEmail,
        notificationPhone: settings.notificationPhone,
        lowStockThreshold: settings.lowStockThreshold,
        orderDelayThreshold: settings.orderDelayThreshold,
      },
      integrations: {
        paymentProviders: settings.paymentProviders || [],
        inventorySystem: settings.inventorySystem,
        accountingSystem: settings.accountingSystem,
        deliveryProviders: settings.deliveryProviders || [],
        posSystem: settings.posSystem,
        paymentGateway: settings.paymentGateway,
      },
    };
  }
}
