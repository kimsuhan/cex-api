import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEmail, MaxLength, MinLength } from 'class-validator';

@ObjectType()
export class AccountType {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateAccountInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(1)
  password: string;
}

@ObjectType()
export class LoginResponse {
  @Field()
  token: string;

  @Field(() => AccountType)
  user: AccountType;
}
