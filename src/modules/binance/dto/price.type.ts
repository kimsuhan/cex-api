import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PriceType {
  @Field()
  price: number;
}
