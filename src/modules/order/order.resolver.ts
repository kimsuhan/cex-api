import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { OrderMatchingEnginePayload } from 'src/modules/order/dto/order.type';
import { OrderService } from 'src/modules/order/order.service';

@Resolver(() => Boolean)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Mutation(() => Boolean)
  async sendOrderToMatchingEngine(
    @Args('order') order: OrderMatchingEnginePayload,
  ) {
    await this.orderService.sendOrderToMatchingEngine(order);

    return true;
  }
}
