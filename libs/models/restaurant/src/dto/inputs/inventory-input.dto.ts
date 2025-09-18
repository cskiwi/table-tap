import { Field, InputType, Float, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, IsUUID, Min, IsDateString } from 'class-validator';
import { InventoryStatus } from '../../enums/inventory-status.enum';

@InputType('CreateInventoryItemInput')
export class CreateInventoryItemInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  declare sku: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  declare itemName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare description: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare category: string;

  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  declare currentStock: number;

  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  declare minimumStock: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare maximumStock: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare unitCost: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare unit: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare supplier: string;

  @Field(() => InventoryStatus, { defaultValue: InventoryStatus.ACTIVE })
  @IsOptional()
  @IsEnum(InventoryStatus)
  declare status: InventoryStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  declare expiryDate: string;

  @Field()
  @IsNotEmpty()
  @IsUUID()
  declare cafeId: string;
}

@InputType('UpdateInventoryStockInput')
export class UpdateInventoryStockInput {
  @Field(() => Int)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  declare currentStock: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare notes: string;
}

@InputType('UpdateInventoryItemInput')
export class UpdateInventoryItemInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare itemName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare description: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare category: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare minimumStock: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare maximumStock: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare unitCost: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare unit: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare supplier: string;

  @Field(() => InventoryStatus, { nullable: true })
  @IsOptional()
  @IsEnum(InventoryStatus)
  declare status: InventoryStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  declare expiryDate: string;
}