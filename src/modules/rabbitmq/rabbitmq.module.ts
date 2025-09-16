import { Global, Module } from '@nestjs/common';

export const RABBITMQ = 'PROVIDER_RABBITMQ';

@Global()
@Module({
  imports: [],
  exports: [],
})
export class RabbitMQModule {}
