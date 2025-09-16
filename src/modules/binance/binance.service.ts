import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import binanceApiNode, { Binance, Ticker, Trade } from 'binance-api-node';
import Redis from 'ioredis';
import { AllPrice } from 'src/modules/binance/dto/all-price.type';
import { REDIS_CLIENT } from 'src/modules/redis/redis.module';

@Injectable()
export class BinanceService implements OnModuleInit {
  private latestPrice: Record<string, number> = {};
  private readonly client: Binance;

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

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.client = binanceApiNode();
  }

  onModuleInit() {
    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners() {
    const lastTradeTime: Record<string, number> = {};

    // 24시간 Ticker 가격
    this.client.ws.ticker(this.symbols, (ticker: Ticker) => {
      // 거래가 5초 이상 없었으면 ticker 가격 사용
      const timeSinceLastTrade =
        ticker.eventTime - (lastTradeTime[ticker.symbol] ?? 0);
      if (timeSinceLastTrade > 5000) {
        this.latestPrice[ticker.symbol] = parseFloat(ticker.curDayClose);

        // Redis에 저장
        void this.savePriceToRedis(
          ticker.symbol,
          parseFloat(ticker.curDayClose),
          'ticker',
          ticker.eventTime,
        );
      }
    });

    // 실시간 Trade 가격
    this.client.ws.trades(this.symbols, (trade: Trade) => {
      lastTradeTime[trade.symbol] = trade.eventTime;
      this.latestPrice[trade.symbol] = parseFloat(trade.price);

      // Redis에 저장
      void this.savePriceToRedis(
        trade.symbol,
        parseFloat(trade.price),
        'trade',
        trade.eventTime,
      );
    });
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
}
