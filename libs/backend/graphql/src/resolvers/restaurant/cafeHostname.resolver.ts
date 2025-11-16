import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Cafe, CafeHostname, User } from '@app/models';
import { Injectable, UseGuards } from '@nestjs/common';
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
// not working
import { CafeArgs, CafeHostnameArgs } from '../../args';
import { PublicAccess } from '../../middleware/role-access-control.middleware';

@Injectable()
@Resolver(() => CafeHostname)
export class CafeHostnameResolver {
  constructor(
    @InjectRepository(CafeHostname)
    private readonly cafeHostnameRepository: Repository<CafeHostname>,
    @InjectRepository(Cafe)
    private readonly cafeRepository: Repository<Cafe>,
  ) {}

  // Queries
  @Query(() => [CafeHostname])
  @PublicAccess() // Public: Required for hostname-based cafe detection
  async cafeHostnames(
    @Args('args', { type: () => CafeHostnameArgs, nullable: true })
    inputArgs?: InstanceType<typeof CafeHostnameArgs>,
  ): Promise<CafeHostname[]> {
    const args = CafeHostnameArgs.toFindOneOptions(inputArgs);

    return this.cafeHostnameRepository.find({
      ...args,
    });
  }

  @Query(() => CafeHostname, { nullable: true })
  @PublicAccess() // Public: Required for hostname-based cafe detection
  async cafeHostname(@Args('id') id: string): Promise<CafeHostname | null> {
    // Use repository directly for simple CRUD
    return this.cafeHostnameRepository.findOne({
      where: { id },
    });
  }

  @ResolveField(() => Cafe)
  async cafe(@Parent() cafehostname: CafeHostname): Promise<Cafe> {
    // If cafe is already loaded, return it
    if (cafehostname.cafe) {
      return cafehostname.cafe;
    }
    // Otherwise, lazy load using cafeId
    const cafe = await this.cafeRepository.findOne({
      where: { id: cafehostname.cafeId },
    });
    return cafe!;
  }
}
