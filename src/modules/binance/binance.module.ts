import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { BinanceResolver } from './binance.resolver';
import { BinanceService } from './binance.service';

@Module({
  providers: [
    BinanceService,
    BinanceResolver,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [BinanceService],
})
export class BinanceModule {}
