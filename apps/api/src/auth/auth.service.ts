import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider } from '@prisma/client';
import { hash as argonHash, verify as argonVerify } from 'argon2';
import { createHash, randomInt } from 'node:crypto';
import { MailService } from '../notifications/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

const CODE_TTL_MS = 15 * 60 * 1000; // 15분
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 1분

const hashCode = (code: string) =>
  createHash('sha256').update(code).digest('hex');

export interface JwtPayload {
  sub: string; // user id
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
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
    const code = this.generateCode();
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        provider: AuthProvider.EMAIL,
        name: dto.name,
        verificationCodeHash: hashCode(code),
        verificationCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    await this.sendVerificationMail(user.email, code);

    return this.issueToken(user.id, user.role);
  }

  /** 인증 코드 검증 — 성공 시 emailVerifiedAt 기록 */
  async verifyEmail(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.emailVerifiedAt) {
      return { verified: true }; // 이미 인증됨 — 멱등
    }
    if (
      !user.verificationCodeHash ||
      !user.verificationCodeExpiresAt ||
      user.verificationCodeExpiresAt < new Date()
    ) {
      throw new BadRequestException('Code expired — request a new one');
    }
    if (user.verificationAttempts >= MAX_VERIFY_ATTEMPTS) {
      throw new BadRequestException('Too many attempts — request a new code');
    }

    if (hashCode(code) !== user.verificationCodeHash) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { verificationAttempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        verificationCodeHash: null,
        verificationCodeExpiresAt: null,
        verificationAttempts: 0,
      },
    });
    return { verified: true };
  }

  /** 인증 코드 재발송 — 1분 쿨다운 (만료시각-TTL = 마지막 발송시각) */
  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (user.emailVerifiedAt) {
      return { sent: false, reason: 'already verified' };
    }

    if (user.verificationCodeExpiresAt) {
      const lastSentAt = user.verificationCodeExpiresAt.getTime() - CODE_TTL_MS;
      if (Date.now() - lastSentAt < RESEND_COOLDOWN_MS) {
        throw new BadRequestException('Please wait before requesting again');
      }
    }

    const code = this.generateCode();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        verificationCodeHash: hashCode(code),
        verificationCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
        verificationAttempts: 0,
      },
    });
    await this.sendVerificationMail(user.email, code);
    return { sent: true };
  }

  private generateCode() {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private sendVerificationMail(email: string, code: string) {
    return this.mail.send(
      email,
      `[LUNOTE] Your verification code: ${code}`,
      `Welcome to LUNOTE!\n\nYour verification code is: ${code}\n\nEnter this code in the app to verify your email. It expires in 15 minutes.\n\nIf you didn't create an account, you can ignore this email.`,
    );
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
