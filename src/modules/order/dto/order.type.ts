import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class OrderMatchingEnginePayload {
  @Field()
  id: string;

  @Field()
  symbol: string;

  @Field()
  price: string;

  @Field()
  quantity: string;

  @Field()
  side: 'BUY' | 'SELL';
}
