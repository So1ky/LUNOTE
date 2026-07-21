import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider } from '@prisma/client';
import { hash as argonHash, verify as argonVerify } from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

export interface JwtPayload {
  sub: string; // user id
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    // argon2의 .d.cts가 구현 시그니처를 Promise<any>로 내보내서 단언 필요 (encoded hash는 string)
    const passwordHash = (await argonHash(dto.password)) as string;
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        provider: AuthProvider.EMAIL,
        name: dto.name,
      },
    });

    return this.issueToken(user.id, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // 소셜 가입 계정(passwordHash null)도 동일한 에러로 응답 — 계정 존재 여부를 노출하지 않는다
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argonVerify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken(user.id, user.role);
  }

  private issueToken(userId: string, role: string) {
    const payload: JwtPayload = { sub: userId, role };
    return { accessToken: this.jwt.sign(payload) };
  }
}
