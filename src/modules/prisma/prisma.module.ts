import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export const PRISMA_CLIENT = 'PROVIDER_PRISMA_CLIENT';

@Module({
  providers: [
    {
      provide: PRISMA_CLIENT,
      useFactory: () => new PrismaClient(),
    },
  ],
  exports: [PRISMA_CLIENT],
})
@Global()
export class PrismaModule {}
