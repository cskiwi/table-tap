import { registerEnumType } from '@nestjs/graphql';

export enum MenuItemStatus {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
  SEASONAL = 'SEASONAL',
}

registerEnumType(MenuItemStatus, {
  name: 'MenuItemStatus',
  description: 'The availability status of a menu item',
});