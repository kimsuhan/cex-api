import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrderResolver } from 'src/modules/order/order.resolver';
import { OrderService } from 'src/modules/order/order.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin123@localhost:5672'],
          queue: 'orders_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [OrderService, OrderResolver],
  exports: [OrderService],
})
export class OrderModule {}
