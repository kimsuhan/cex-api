import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PubSub } from 'graphql-subscriptions';
import Redis from 'ioredis';
import { BinanceService } from 'src/modules/binance/binance.service';
import { PUB_SUB } from 'src/modules/pubsub/pubsub.module';
import { REDIS_CLIENT } from 'src/modules/redis/redis.module';

@Injectable()
export class BinanceSchedule implements OnModuleInit {
  private readonly logger = new Logger(BinanceSchedule.name);

  onModuleInit() {
    // // 전체 제거
    // const keys = await this.redis.keys('chart:*');
    // const pipeline = this.redis.pipeline();
    // keys.forEach((key) => {
    //   pipeline.zremrangebyscore(key, '-inf', Date.now());
    // });
    // await pipeline.exec();
  }

  constructor(
    private readonly binanceService: BinanceService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Cron(CronExpression.EVERY_SECOND)
  async saveTickPrice() {
    const now = Date.now();
    const prices = await this.binanceService.getAllPrices();

    const pipeline = this.redis.pipeline();
    await Promise.all(
      prices.map((price) => {
        pipeline.zadd(`chart:${price.symbol}`, now, price.price);

        void this.pubSub.publish(`CHART_PRICE_UPDATED_${price.symbol}`, {
          chartPriceUpdated: { price: price.price, time: new Date(now) },
        });
      }),
    );

    await pipeline.exec();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteOneDayAgoPrice() {
    // API 호출 대신 Redis 키 목록 사용
    const keys = await this.redis.keys('chart:*');
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const pipeline = this.redis.pipeline();
    keys.forEach((key) => {
      pipeline.zremrangebyscore(key, '-inf', oneDayAgo);
    });

    await pipeline.exec();
  }
}
