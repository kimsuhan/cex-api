import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccountService } from 'src/modules/account/account.service';
import {
  AccountType,
  CreateAccountInput,
  LoginInput,
  LoginResponse,
} from 'src/modules/account/dto/account.type';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';

@Resolver(() => AccountType)
export class AccountResolver {
  constructor(private readonly accountService: AccountService) {}

  @Mutation(() => AccountType)
  async register(@Args('input') input: CreateAccountInput) {
    return this.accountService.register(input.email, input.password);
  }

  @Mutation(() => LoginResponse)
  async login(@Args('input') input: LoginInput) {
    return this.accountService.login(input.email, input.password);
  }

  @Query(() => AccountType)
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: { req: { user: { sub: string } } }) {
    const user = context.req.user;
    return this.accountService.findById(user.sub);
  }
}
