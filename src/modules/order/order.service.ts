import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { OrderMatchingEnginePayload } from 'src/modules/order/dto/order.type';

@Injectable()
export class OrderService {
  constructor(
    @Inject('RABBITMQ_CLIENT') private readonly rabbitmq: ClientProxy,
  ) {}

  async sendOrderToMatchingEngine(order: OrderMatchingEnginePayload) {
    const pattern = 'process_order';
    const payload = {
      orderId: order.id,
      symbol: order.symbol,
      price: order.price,
      quantity: order.quantity,
      side: order.side, // 'BUY' | 'SELL'
      timestamp: Date.now(),
    };

    console.log('🚀 Sending order to Java matching engine:', payload);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await firstValueFrom(
      this.rabbitmq.emit(pattern, payload).pipe(
        timeout(5000), // 5초 타임아웃
      ),
    );

    console.log(result);
  }

  async sendPriceUpdate(symbol: string, price: number) {
    const pattern = 'price_update';
    const payload = { symbol, price, timestamp: Date.now() };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await firstValueFrom(
      this.rabbitmq.emit(pattern, payload).pipe(timeout(5000)),
    );
  }

  // Fire-and-forget 방식 (응답 불필요)
  sendOrderAsync(order: OrderMatchingEnginePayload) {
    const pattern = 'process_order';
    const payload = {
      orderId: order.id,
      symbol: order.symbol,
      price: order.price,
      quantity: order.quantity,
      side: order.side,
      timestamp: Date.now(),
    };

    console.log('🚀 Sending order (async):', payload);

    // emit은 바로 실행 (Promise 반환 안함)
    this.rabbitmq.emit(pattern, payload);
  }
}
