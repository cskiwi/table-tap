import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User } from '@app/models';
import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';

@Resolver(() => User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  @UseGuards(PermGuard)
  async me(@ReqUser() user: User): Promise<User | null> {
    if (user?.id) {
      return user;
    } else {
      return null;
    }
  }
}
