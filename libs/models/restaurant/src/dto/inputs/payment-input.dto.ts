import { Field, InputType, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from '../../enums/payment-method.enum';

@InputType('ProcessPaymentInput')
export class ProcessPaymentInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  declare orderId: string;

  @Field(() => PaymentMethod)
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  declare method: PaymentMethod;

  @Field(() => Float)
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  declare amount: number;

  @Field({ defaultValue: 'USD' })
  @IsOptional()
  @IsString()
  declare currency: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare processorTransactionId: string;

  @Field({ nullable: true })
  @IsOptional()
  declare metadata: Record<string, any>;
}

@InputType('RefundPaymentInput')
export class RefundPaymentInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  declare paymentId: string;

  @Field(() => Float)
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  declare amount: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  declare reason: string;
}