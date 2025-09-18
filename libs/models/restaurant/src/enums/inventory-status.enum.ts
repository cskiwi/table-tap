import { registerEnumType } from '@nestjs/graphql';

export enum InventoryStatus {
  ACTIVE = 'ACTIVE',
  DISCONTINUED = 'DISCONTINUED',
  SEASONAL = 'SEASONAL',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

registerEnumType(InventoryStatus, {
  name: 'InventoryStatus',
  description: 'The status of an inventory item',
});