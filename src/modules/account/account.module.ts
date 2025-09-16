import { Module } from '@nestjs/common';
import { AccountResolver } from 'src/modules/account/account.resolver';
import { AccountService } from 'src/modules/account/account.service';

@Module({
  imports: [],
  providers: [AccountService, AccountResolver],
  exports: [AccountService],
})
export class AccountModule {}
