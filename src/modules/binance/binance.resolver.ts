import { Inject } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AllPrice } from 'src/modules/binance/dto/all-price.type';
import { ChartPrice } from 'src/modules/binance/dto/chart-price.type';
import { PUB_SUB } from 'src/modules/pubsub/pubsub.module';
import { BinanceService } from './binance.service';
import { PriceType } from './dto/price.type';

@Resolver('Binance')
export class BinanceResolver {
  constructor(
    private readonly binanceService: BinanceService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => PriceType, { name: 'price', description: '심볼별 가격 조회' })
  async getPrice(@Args('symbol') symbol: string): Promise<PriceType> {
    const price = await this.binanceService.getCurrentPrice(symbol);
    return { price };
  }

  @Query(() => [AllPrice], {
    name: 'prices',
    description: '모든 심볼 가격 조회',
  })
  async getAllPrices(): Promise<AllPrice[]> {
    return await this.binanceService.getAllPrices();
  }

  @Subscription(() => PriceType, {
    name: 'priceUpdated',
    description: '심볼별 가격 실시간 업데이트',
  })
  priceUpdated(@Args('symbol') symbol: string) {
    return this.pubSub.asyncIterableIterator(`PRICE_UPDATED_${symbol}`);
  }

  @Query(() => [ChartPrice], {
    name: 'chartPrice',
    description: '심볼별 차트 가격 조회',
  })
  async getChartPrice(@Args('symbol') symbol: string): Promise<ChartPrice[]> {
    return await this.binanceService.getChartPrice(symbol);
  }

  @Subscription(() => ChartPrice, {
    name: 'chartPriceUpdated',
    description: '심볼별 차트 가격 실시간 업데이트',
  })
  chartPriceUpdated(@Args('symbol') symbol: string) {
    return this.pubSub.asyncIterableIterator(`CHART_PRICE_UPDATED_${symbol}`);
  }
}
