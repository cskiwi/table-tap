import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsEmail, IsEnum, Matches, IsObject } from 'class-validator';
import { CafeStatus } from '../../enums/cafe-status.enum';

@InputType('CreateCafeInput')
export class CreateCafeInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  declare name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare description: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  declare location: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare address: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare phone: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  declare email: string;

  @Field(() => CafeStatus, { nullable: true, defaultValue: CafeStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CafeStatus)
  declare status: CafeStatus;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Open time must be in HH:MM format' })
  declare openTime: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Close time must be in HH:MM format' })
  declare closeTime: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsObject()
  declare settings: Record<string, any>;
}

@InputType('UpdateCafeInput')
export class UpdateCafeInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare description: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare location: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare address: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare phone: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  declare email: string;

  @Field(() => CafeStatus, { nullable: true })
  @IsOptional()
  @IsEnum(CafeStatus)
  declare status: CafeStatus;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Open time must be in HH:MM format' })
  declare openTime: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Close time must be in HH:MM format' })
  declare closeTime: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsObject()
  declare settings: Record<string, any>;
}