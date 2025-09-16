import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { AccountModule } from 'src/modules/account/account.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { BinanceModule } from 'src/modules/binance/binance.module';
import { EnvModule } from 'src/modules/env/env.module';
import { OrderModule } from 'src/modules/order/order.module';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { RabbitMQModule } from 'src/modules/rabbitmq/rabbitmq.module';
import { RedisModule } from 'src/modules/redis/redis.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),

    EnvModule,

    RabbitMQModule,
    RedisModule,
    PrismaModule,

    AuthModule,
    AccountModule,
    BinanceModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
