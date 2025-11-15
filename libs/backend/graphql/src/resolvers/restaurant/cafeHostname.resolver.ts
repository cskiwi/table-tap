import { PermGuard, ReqUser } from '@app/backend-authorization';
import { Cafe, CafeHostname, User } from '@app/models';
import { Injectable, UseGuards } from '@nestjs/common';
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
// not working
import { CafeArgs, CafeHostnameArgs } from '../../args';

@Injectable()
@Resolver(() => CafeHostname)
export class CafeHostnameResolver {
  constructor(
    @InjectRepository(CafeHostname)
    private readonly cafeHostnameRepository: Repository<CafeHostname>,
  ) {}

  // Queries
  @Query(() => [CafeHostname])
  @UseGuards(PermGuard)
  async cafeHostnames(
    @Args('args', { type: () => CafeHostnameArgs, nullable: true })
    inputArgs?: InstanceType<typeof CafeHostnameArgs>,
    @ReqUser()
    user?: User,
  ): Promise<CafeHostname[]> {
    const args = CafeHostnameArgs.toFindOneOptions(inputArgs);

    return this.cafeHostnameRepository.find({
      ...args,
    });
  }

  @Query(() => CafeHostname, { nullable: true })
  @UseGuards(PermGuard)
  async cafeHostname(@Args('id') id: string, @ReqUser() user: User): Promise<CafeHostname | null> {
    // Use repository directly for simple CRUD
    return this.cafeHostnameRepository.findOne({
      where: { id },
    });
  }

  @ResolveField(() => Cafe)
  async cafes(@Parent() cafehostname: CafeHostname): Promise<Cafe> {
    return cafehostname.cafe;
  }
}
