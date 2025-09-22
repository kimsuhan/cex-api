import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChartPrice {
  @Field()
  price: number;
  @Field()
  time: Date;
}
