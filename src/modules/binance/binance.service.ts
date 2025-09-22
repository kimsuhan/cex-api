import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import binanceApiNode, { Binance, Ticker, Trade } from 'binance-api-node';
import { PubSub } from 'graphql-subscriptions';
import Redis from 'ioredis';
import { AllPrice } from 'src/modules/binance/dto/all-price.type';
import { ChartPrice } from 'src/modules/binance/dto/chart-price.type';
import { PUB_SUB } from 'src/modules/pubsub/pubsub.module';
import { REDIS_CLIENT } from 'src/modules/redis/redis.module';

@Injectable()
export class BinanceService implements OnModuleInit {
  private readonly logger = new Logger(BinanceService.name);
  private latestPrice: Record<string, number> = {};
  private lastUpdateTime: Record<string, number> = {};
  private updateCount: Record<string, number> = {};
  private readonly client: Binance;

  // 최적화 설정
  private readonly MIN_CHANGE_THRESHOLD = 0.000001; // 0.01% 이상 변경시만 업데이트
  private readonly DEBOUNCE_TIME = 100; // 100ms 디바운싱
  private readonly MAX_UPDATES_PER_SECOND = 10; // 심볼별 초당 최대 업데이트 수

  private readonly symbols = [
    'BTCUSDT',
    'ETHUSDT',
    'SOLUSDT',
    'XRPUSDT',
    'DOGEUSDT',
    'ADAUSDT',
    'DOTUSDT',
    'LINKUSDT',
    'BCHUSDT',
    'LTCUSDT',
  ];

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {
    this.client = binanceApiNode();
  }

  onModuleInit() {
    this.setupEventListeners();
    this.setupUpdateCountReset();
  }

  /**
   * 업데이트 카운트 초기화 (매초)
   */
  private setupUpdateCountReset() {
    setInterval(() => {
      this.updateCount = {};
    }, 1000);
  }

  /**
   * 가격 업데이트가 필요한지 체크
   * @param symbol 심볼
   * @param newPrice 새로운 가격
   * @returns 업데이트 필요 여부
   */
  private shouldUpdatePrice(symbol: string, newPrice: number): boolean {
    const currentPrice = this.latestPrice[symbol];
    const now = Date.now();
    const lastUpdate = this.lastUpdateTime[symbol] || 0;
    const updateCount = this.updateCount[symbol] || 0;

    // 1. 가격이 동일한 경우 업데이트하지 않음
    if (currentPrice === newPrice) {
      // this.logger.warn(`Price is the same: ${symbol} ${newPrice}`);
      return false;
    }

    // 2. 디바운싱: 너무 빈번한 업데이트 방지
    if (now - lastUpdate < this.DEBOUNCE_TIME) {
      // this.logger.warn(`Debounce time: ${symbol} ${newPrice}`);
      return false;
    }

    // 3. 업데이트 빈도 제한: 초당 최대 업데이트 수 초과시 방지
    if (updateCount >= this.MAX_UPDATES_PER_SECOND) {
      // this.logger.warn(`Max updates per second: ${symbol} ${newPrice}`);
      return false;
    }

    // 4. 최소 변경 임계값 체크: 너무 작은 변화는 무시
    // if (currentPrice && currentPrice > 0) {
    //   const changePercent = Math.abs(newPrice - currentPrice) / currentPrice;
    //   if (changePercent < this.MIN_CHANGE_THRESHOLD) {
    //     this.logger.warn(`Min change threshold: ${symbol} ${newPrice}`);
    //     return false;
    //   }
    // }

    return true;
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners() {
    const lastTradeTime: Record<string, number> = {};

    // 24시간 Ticker 가격
    this.client.ws.ticker(this.symbols, (ticker: Ticker) => {
      // 거래가 1초 이상 없었으면 ticker 가격 사용
      const timeSinceLastTrade =
        ticker.eventTime - (lastTradeTime[ticker.symbol] ?? 0);
      if (timeSinceLastTrade > 1000) {
        const newPrice = parseFloat(ticker.curDayClose);

        // 최적화된 업데이트 체크
        if (this.shouldUpdatePrice(ticker.symbol, newPrice)) {
          this.latestPrice[ticker.symbol] = newPrice;
          this.lastUpdateTime[ticker.symbol] = Date.now();
          this.updateCount[ticker.symbol] =
            (this.updateCount[ticker.symbol] || 0) + 1;

          // Redis에 저장
          void this.savePriceToRedis(
            ticker.symbol,
            newPrice,
            'ticker',
            ticker.eventTime,
          );
        }
      }
    });

    // 실시간 Trade 가격
    this.client.ws.trades(this.symbols, (trade: Trade) => {
      lastTradeTime[trade.symbol] = trade.eventTime;
      const newPrice = parseFloat(trade.price);

      // 최적화된 업데이트 체크
      if (this.shouldUpdatePrice(trade.symbol, newPrice)) {
        this.latestPrice[trade.symbol] = newPrice;
        this.lastUpdateTime[trade.symbol] = Date.now();
        this.updateCount[trade.symbol] =
          (this.updateCount[trade.symbol] || 0) + 1;

        // Redis에 저장
        void this.savePriceToRedis(
          trade.symbol,
          newPrice,
          'trade',
          trade.eventTime,
        );
      }
    });
  }

  /**
   * GraphQL Subscription 이벤트 발행
   * @param symbol 심볼
   * @param price 가격
   */
  private async publishPriceUpdate(symbol: string, price: number) {
    try {
      this.logger.debug(`Save price to Redis: ${symbol} ${price}`);
      await this.pubSub.publish(`PRICE_UPDATED_${symbol}`, {
        priceUpdated: { price },
      });
    } catch (error) {
      this.logger.error(`Failed to publish price update for ${symbol}:`, error);
    }
  }

  /**
   *
   * @param symbol
   * @param price
   * @param source
   * @param eventTime
   */
  private async savePriceToRedis(
    symbol: string,
    price: number,
    source: 'trade' | 'ticker',
    eventTime: number,
  ) {
    const pipeline = this.redis.pipeline();

    // 1. 개별 심볼 상세 정보
    pipeline.hset(`price:${symbol}`, {
      price: price.toString(),
      source,
      eventTime: eventTime.toString(),
      timestamp: Date.now().toString(),
    });

    // 2. 전체 가격 개요 (빠른 조회용)
    pipeline.hset('prices:latest', symbol, price.toString());

    // 3. TTL 설정 (1시간)
    pipeline.expire(`price:${symbol}`, 3600);

    await pipeline.exec();

    // GraphQL Subscription 이벤트 발행
    void this.publishPriceUpdate(symbol, price);
  }

  /**
   * 현재 가격 조회
   *
   * @param symbol 심볼
   * @returns 현재 가격
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    // 메모리 우선, Redis 백업
    const memoryPrice = this.latestPrice[symbol];
    if (memoryPrice) return memoryPrice;

    const redisPrice = await this.redis.hget(`price:${symbol}`, 'price');
    return redisPrice ? parseFloat(redisPrice) : 0;
  }

  async getAllPrices(): Promise<AllPrice[]> {
    const prices = await this.redis.hgetall('prices:latest');
    const result: Record<string, number> = {};

    for (const [symbol, price] of Object.entries(prices)) {
      result[symbol] = parseFloat(price);
    }

    return Object.entries(result).map(([symbol, price]) => ({
      symbol,
      price,
    }));
  }

  /**
   *
   * @param symbol
   * @param price
   */
  async tickSavePriceToRedis(symbol: string, price: number) {
    const pipeline = this.redis.pipeline();

    pipeline.zadd(`chart:${symbol}`, Date.now(), price);

    await pipeline.exec();
  }

  async getChartPrice(symbol: string): Promise<ChartPrice[]> {
    const chartData = await this.redis.zrangebyscore(
      `chart:${symbol}`,
      Date.now() - 24 * 60 * 60 * 1000, // 24시간 전
      Date.now(), // 현재
      'WITHSCORES',
    );

    const result: ChartPrice[] = [];

    for (let i = 0; i < chartData.length; i += 2) {
      result.push({
        price: parseFloat(chartData[i]), // value (price)
        time: new Date(Number(chartData[i + 1])), // score (timestamp) - 한국시간(UTC+9)으로 변환
      });
    }

    return result;
  }

  // 최근 24시간 데이터 (시간순 정렬)
}
