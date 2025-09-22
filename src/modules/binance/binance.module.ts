import { Module } from '@nestjs/common';
import { BinanceSchedule } from 'src/modules/binance/binance.schedule';
import { BinanceResolver } from './binance.resolver';
import { BinanceService } from './binance.service';

@Module({
  providers: [BinanceService, BinanceResolver, BinanceSchedule],
  exports: [BinanceService],
})
export class BinanceModule {}
