import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  AccountType,
  LoginResponse,
} from 'src/modules/account/dto/account.type';
import { PRISMA_CLIENT } from 'src/modules/prisma/prisma.module';

@Injectable()
export class AccountService {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 계정 등록
   *
   * @param email 이메일
   * @param password 비밀번호
   * @returns 계정 정보
   */
  async register(email: string, password: string): Promise<AccountType> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const account = await this.prisma.account.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return {
      id: account.id,
      email: account.email,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  /**
   * 로그인
   *
   * @param email 이메일
   * @param password 비밀번호
   * @returns JWT 토큰과 사용자 정보
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const payload = { sub: account.id, email: account.email };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: account.id,
        email: account.email,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
    };
  }

  /**
   * ID로 계정 조회
   *
   * @param id 계정 ID
   * @returns 계정 정보
   */
  async findById(id: string): Promise<AccountType | null> {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      return null;
    }

    return {
      id: account.id,
      email: account.email,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
