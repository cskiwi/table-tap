import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, AdminSettings, Cafe } from '@app/models';
import { AdminSettingsUpdateInput } from '../../inputs/admin-settings.input';
import { AdminSettingsArgs } from '../../args';

@Injectable()
@Resolver(() => AdminSettings)
export class AdminSettingsResolver {
  private readonly logger = new Logger(AdminSettingsResolver.name);

  constructor(
    @InjectRepository(AdminSettings)
    private readonly settingsRepository: Repository<AdminSettings>,
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
  ) {}

  @Query(() => AdminSettings, { name: 'adminSettings', nullable: true })
  @UseGuards(PermGuard)
  async adminSettings(@Args('cafeId') cafeId: string, @ReqUser() user?: User): Promise<AdminSettings | null> {
    try {
      const settings = await this.settingsRepository.findOne({
        where: { cafeId },
      });

      return settings || null;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch admin settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Mutation(() => AdminSettings, { name: 'updateAdminSettings' })
  @UseGuards(PermGuard)
  async updateAdminSettings(
    @Args('cafeId') cafeId: string,
    @Args('input') input: AdminSettingsUpdateInput,
    @ReqUser() user?: User,
  ): Promise<AdminSettings> {
    try {
      let settings = await this.settingsRepository.findOne({
        where: { cafeId },
      });

      if (!settings) {
        settings = this.settingsRepository.create({ cafeId, ...input });
        return await this.settingsRepository.save(settings);
      }

      await this.settingsRepository.update(settings.id, input);
      const updated = await this.settingsRepository.findOne({
        where: { id: settings.id },
      });

      return updated!;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update admin settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // Field Resolvers - Use parent object when available, lazy load via ID when not
  @ResolveField(() => Cafe)
  async cafe(@Parent() settings: AdminSettings): Promise<Cafe> {
    if (settings.cafe) return settings.cafe;
    const cafe = await this.cafeRepository.findOne({ where: { id: settings.cafeId } });
    if (!cafe) throw new Error(`Cafe with ID ${settings.cafeId} not found`);
    return cafe;
  }
}
