import { Module } from '@nestjs/common';
import { OrderResolver } from 'src/modules/order/order.resolver';
import { OrderService } from 'src/modules/order/order.service';

@Module({
  imports: [],
  providers: [OrderService, OrderResolver],
  exports: [OrderService],
})
export class OrderModule {}
