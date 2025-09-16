import { Args, Query, Resolver } from '@nestjs/graphql';
import { AllPrice } from 'src/modules/binance/dto/all-price.type';
import { BinanceService } from './binance.service';
import { Price } from './dto/price.type';

@Resolver(() => Price)
export class BinanceResolver {
  constructor(private readonly binanceService: BinanceService) {}

  @Query(() => Price, { description: '심볼별 가격 조회' })
  async getPrice(
    @Args('symbol', { defaultValue: 'BTCUSDT' }) symbol: string,
  ): Promise<Price> {
    const price = await this.binanceService.getCurrentPrice(symbol);
    return { price };
  }

  @Query(() => [AllPrice], { description: '모든 심볼 가격 조회' })
  async getAllPrices(): Promise<AllPrice[]> {
    return await this.binanceService.getAllPrices();
  }
}
