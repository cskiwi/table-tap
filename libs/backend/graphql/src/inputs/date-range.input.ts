import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class DateRangeInput {
  @Field(() => Date)
  startDate!: Date;

  @Field(() => Date)
  endDate!: Date;
}
