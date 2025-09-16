import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ENV_SCHEMA } from 'src/modules/env/env.provider';

export const ORDER_RABBITMQ_CLIENT = 'PROVIDER_ORDER_RABBITMQ_CLIENT';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: ORDER_RABBITMQ_CLIENT,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const url = `amqp://${configService.getOrThrow(ENV_SCHEMA.RMQ_ID)}:${configService.getOrThrow(ENV_SCHEMA.RMQ_PASSWORD)}@${configService.getOrThrow(ENV_SCHEMA.RMQ_HOST)}:${configService.getOrThrow(ENV_SCHEMA.RMQ_PORT)}`;
          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
              queue: 'orders_queue',
              queueOptions: {
                durable: true,
              },
            },
          };
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitMQModule {}
