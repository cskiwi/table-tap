import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsDateString } from 'class-validator';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

@InputType('PaginationInput')
export class PaginationInput {
  @Field(() => Int, { defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare skip: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  declare take: number;
}

@InputType('SortInput')
export class SortInput {
  @Field()
  @IsString()
  declare field: string;

  @Field(() => SortDirection, { defaultValue: SortDirection.DESC })
  @IsOptional()
  @IsEnum(SortDirection)
  declare direction: SortDirection;
}

@InputType('DateRangeFilter')
export class DateRangeFilter {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  declare from: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  declare to: string;
}

@InputType('SearchFilter')
export class SearchFilter {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare query: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  declare fields: string[];
}