import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ENV_SCHEMA } from 'src/modules/env/env.provider';

export const REDIS_CLIENT = 'PROVIDER_REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new Redis({
          host: configService.getOrThrow(ENV_SCHEMA.REDIS_HOST),
          port: configService.getOrThrow<number>(ENV_SCHEMA.REDIS_PORT),
        }),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
