import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AllPrice {
  @Field()
  symbol: string;
  @Field()
  price: number;
}
