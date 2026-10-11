import { Injectable } from '@nestjs/common';
import { PushPlatform } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** 푸시 토큰 등록/해제 — 토큰 존재가 곧 opt-in (ARCHITECTURE §11 푸시 알림) */
@Injectable()
export class PushTokensService {
  constructor(private readonly prisma: PrismaService) {}

  /** 같은 토큰이 다른 사용자로 오면 소유자를 옮긴다 (기기 공유·재로그인) */
  async upsert(userId: string, token: string, platform: PushPlatform) {
    const now = new Date();
    await this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform, lastSeenAt: now },
      update: { userId, platform, lastSeenAt: now },
    });
  }

  /** 본인 소유 토큰만 지운다 — 없어도 성공(멱등) */
  async remove(userId: string, token: string) {
    await this.prisma.pushToken.deleteMany({ where: { userId, token } });
  }
}
