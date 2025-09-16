import { Module } from '@nestjs/common';
import { BinanceResolver } from './binance.resolver';
import { BinanceService } from './binance.service';

@Module({
  providers: [BinanceService, BinanceResolver],
  exports: [BinanceService],
})
export class BinanceModule {}
