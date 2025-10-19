import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { Product } from '@app/models';

@InputType()
export class ProductUpdateInput extends PartialType(
  OmitType(Product, [
    
    'createdAt',
    'updatedAt',
    'deletedAt',
    'cafe',
    'orderItems',
    'stockItems',
    'finalPrice',
    'isOnSale',
    'isInStock',
    'needsRestock',
  ] as const),
  InputType
) {}

@InputType()
export class ProductCreateInput extends PartialType(
  OmitType(ProductUpdateInput, ['id'] as const),
  InputType
) {}
