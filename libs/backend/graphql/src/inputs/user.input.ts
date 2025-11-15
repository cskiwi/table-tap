import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { User } from '@app/models';

@InputType()
export class UserUpdateInput extends PartialType(
  OmitType(User, [

    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafes',
    'employeeProfiles',
    'orders',
    'ordersCreatedByEmployee',
    'credits',
    'loyaltyAccount',
    'fullName',
    'displayName',
    'isEmployee',
  ] as const),
  InputType
) {}

@InputType()
export class UserCreateInput extends PartialType(
  OmitType(UserUpdateInput, ['id'] as const),
  InputType
) {}
