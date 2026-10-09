import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import { verify as argonVerify } from 'argon2';
import { AppleAuthClient } from '../auth/social/apple-auth.client';
import { AppleTokenVerifier } from '../auth/social/apple-token.verifier';
import { GoogleTokenVerifier } from '../auth/social/google-token.verifier';
import type { SocialIdentity } from '../auth/social/social-identity';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AccountDeletionService } from './account-deletion.service';
import { DeleteMeDto } from './dto/delete-me.dto';
import { UpdateMeDto } from './dto/update-me.dto';

/** 프로필 응답 공통 SELECT — /auth/me와 PATCH /users/me가 같은 모양을 반환한다 */
const PROFILE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  emailVerifiedAt: true,
  language: true,
  avatarS3Key: true,
  // 앱이 비밀번호 메뉴·탈퇴 재인증 방식을 고르는 기준
  provider: true,
} as const;

/** 탈퇴 재인증 토큰의 최대 나이 — 예전에 받아 둔 토큰으로 되돌릴 수 없는 삭제를 못 하게 */
const REAUTH_MAX_AGE_MS = 5 * 60 * 1000;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly accountDeletion: AccountDeletionService,
    private readonly google: GoogleTokenVerifier,
    private readonly apple: AppleTokenVerifier,
    private readonly appleAuth: AppleAuthClient,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    return this.withAvatarUrl(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    // 아바타 키는 본인 업로드 프리픽스만 허용 — 타인 파일 참조(IDOR) 차단
    if (dto.avatarS3Key && !dto.avatarS3Key.startsWith(`uploads/${userId}/`)) {
      throw new ForbiddenException('avatarS3Key does not belong to you');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName?.trim() || undefined,
        lastName: dto.lastName?.trim() || undefined,
        language: dto.language,
        avatarS3Key: dto.avatarS3Key,
      },
      select: PROFILE_SELECT,
    });
    return this.withAvatarUrl(user);
  }

  /**
   * 본인 탈퇴 — 가입 방식으로 재인증 후 익명화 (탈취된 액세스 토큰만으로는 되돌릴 수 없는 삭제를 못 하게).
   * 실패는 400 — 앱 클라이언트는 401을 세션 만료로 보고 로그아웃시킨다.
   */
  async deleteMe(userId: string, dto: DeleteMeDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { provider: true, providerId: true, passwordHash: true },
    });

    switch (user.provider) {
      case AuthProvider.EMAIL: {
        if (!dto.password || !user.passwordHash) {
          throw new BadRequestException('Password is required');
        }
        if (!(await argonVerify(user.passwordHash, dto.password))) {
          throw new BadRequestException('Password is incorrect');
        }
        await this.accountDeletion.deleteAccount(userId);
        break;
      }
      case AuthProvider.GOOGLE: {
        if (!dto.idToken) {
          throw new BadRequestException('Google re-authentication is required');
        }
        this.assertReauth(
          user.providerId,
          await this.google.verify({ idToken: dto.idToken }),
        );
        await this.accountDeletion.deleteAccount(userId);
        break;
      }
      case AuthProvider.APPLE: {
        if (!dto.identityToken || !dto.authorizationCode) {
          throw new BadRequestException('Apple re-authentication is required');
        }
        this.assertReauth(
          user.providerId,
          await this.apple.verify({ identityToken: dto.identityToken }),
        );
        // 교환을 삭제보다 먼저 — Apple 장애면 아무것도 바꾸지 않고 503
        const appleToken = await this.appleAuth.exchangeCode(
          dto.authorizationCode,
        );
        // 409(결제 진행 중)면 여기서 중단 — Apple 연결도 유지된다
        await this.accountDeletion.deleteAccount(userId);
        await this.revokeApple(userId, appleToken);
        break;
      }
    }
    return { deleted: true };
  }

  /** 다른 소셜 계정으로 재인증하거나 예전에 받아 둔 토큰을 재사용하는 것을 막는다 */
  private assertReauth(providerId: string | null, identity: SocialIdentity) {
    if (!providerId || identity.providerId !== providerId) {
      throw new BadRequestException(
        'Re-authentication does not match this account',
      );
    }
    if (Date.now() - identity.issuedAt.getTime() > REAUTH_MAX_AGE_MS) {
      throw new BadRequestException(
        'Re-authentication expired — please try again',
      );
    }
  }

  /** 계정은 이미 삭제됨 — 실패해도 응답은 성공. 사용자는 iPhone 설정에서 직접 연결을 해제할 수 있다 */
  private async revokeApple(userId: string, appleToken: string) {
    if (await this.appleAuth.revoke(appleToken)) return;
    this.logger.error(`Apple revoke 최종 실패 userId=${userId}`);
    Sentry.captureMessage('Apple revoke failed after account deletion', {
      level: 'error',
      extra: { userId },
    });
  }

  private async withAvatarUrl<T extends { avatarS3Key: string | null }>(
    user: T,
  ) {
    const { avatarS3Key, ...rest } = user;
    return {
      ...rest,
      avatarUrl: avatarS3Key
        ? await this.storage.presignDownload(avatarS3Key)
        : null,
    };
  }
}
