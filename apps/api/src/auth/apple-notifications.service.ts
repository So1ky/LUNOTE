import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountDeletionService } from '../users/account-deletion.service';
import { AuthService } from './auth.service';
import { AppleTokenVerifier } from './social/apple-token.verifier';

/**
 * Sign in with Apple 서버 간 알림 (ARCHITECTURE §11 소셜 로그인).
 * 처리 자체가 멱등이라(이미 폐기·이미 탈퇴) 이벤트 저장 테이블을 두지 않는다.
 * Apple의 sub는 로그에 남기지 않는다 — 내부 사용자 ID만.
 */
@Injectable()
export class AppleNotificationsService {
  private readonly logger = new Logger(AppleNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apple: AppleTokenVerifier,
    private readonly auth: AuthService,
    private readonly accountDeletion: AccountDeletionService,
    private readonly notifications: NotificationsService,
  ) {}

  async handle(payload: string) {
    const event = await this.apple.verifyNotification(payload);
    const user = await this.prisma.user.findFirst({
      where: { provider: AuthProvider.APPLE, providerId: event.sub },
      select: { id: true },
    });
    if (!user) {
      this.logger.log(`Apple 알림 무시(사용자 없음) type=${event.type}`);
      return { ok: true };
    }

    switch (event.type) {
      case 'consent-revoked':
        // iPhone 설정에서 연결 해제 — 세션만 끊는다. 다시 Apple 로그인하면 같은 계정
        await this.auth.revokeAllRefreshTokens(user.id);
        break;
      case 'account-delete':
        await this.deleteOrEscalate(user.id);
        break;
      default:
        // email-disabled / email-enabled — 중계 메일 전달 on/off. 앱 푸시는 영향 없음
        break;
    }
    this.logger.log(`Apple 알림 처리 type=${event.type} userId=${user.id}`);
    return { ok: true };
  }

  /** Apple ID가 사라져 다시 로그인할 수 없다 — 자동 탈퇴, 결제 진행 중이면 관리자 수동 정리 */
  private async deleteOrEscalate(userId: string) {
    try {
      await this.accountDeletion.deleteAccount(userId);
    } catch (e) {
      if (!(e instanceof ConflictException)) throw e;
      await this.auth.revokeAllRefreshTokens(userId);
      await this.notifications.notifyAdminsAppleAccountDeleted(
        this.prisma,
        userId,
      );
      this.logger.warn(
        `Apple ID 삭제 — 결제 진행 중이라 탈퇴 보류, 관리자 알림 userId=${userId}`,
      );
    }
  }
}
