import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.const';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useValue: new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
      }),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
