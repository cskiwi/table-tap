import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, AdminSettings } from '@app/models';
import { AdminSettingsUpdateInput } from '../../inputs/admin-settings.input';

@Injectable()
@Resolver(() => AdminSettings)
export class AdminSettingsResolver {
  private readonly logger = new Logger(AdminSettingsResolver.name);

  constructor(
    @InjectRepository(AdminSettings)
    private readonly settingsRepository: Repository<AdminSettings>,
  ) {}

  @Query(() => AdminSettings)
  @UseGuards(PermGuard)
  async adminSettings(@Args('cafeId') cafeId: string, @ReqUser() user?: User): Promise<any> {
    try {
      let settings = await this.settingsRepository.findOne({
        where: { cafeId },
      });

      return settings;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch admin settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Mutation(() => AdminSettings)
  @UseGuards(PermGuard)
  async updateAdminSettings(@Args('cafeId') cafeId: string, @Args('input') input: AdminSettingsUpdateInput, @ReqUser() user?: User): Promise<any> {
    try {
      let settings = await this.settingsRepository.findOne({
        where: { cafeId },
      });

      if (!settings) {
        settings = this.settingsRepository.create({ cafeId });
      }

      return await this.settingsRepository.update(settings.id, input);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update admin settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
