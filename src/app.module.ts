import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { Request, Response } from 'express';
import { LoggerMiddleware } from 'src/middlewares/logger.middleware';
import { AccountModule } from 'src/modules/account/account.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { BinanceModule } from 'src/modules/binance/binance.module';
import { EnvModule } from 'src/modules/env/env.module';
import { OrderModule } from 'src/modules/order/order.module';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { PubSubModule } from 'src/modules/pubsub/pubsub.module';
import { RabbitMQModule } from 'src/modules/rabbitmq/rabbitmq.module';
import { RedisModule } from 'src/modules/redis/redis.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      subscriptions: {
        'graphql-ws': true,
      },
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),

    ScheduleModule.forRoot(),

    EnvModule,

    PubSubModule,
    RabbitMQModule,
    RedisModule,
    PrismaModule,

    AuthModule,
    AccountModule,
    BinanceModule,
    OrderModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
