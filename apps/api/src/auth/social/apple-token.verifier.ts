import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  APPLE_JWKS,
  type Jwks,
  type SocialIdentity,
  type SocialTokenVerifier,
} from './social-identity';
import { verifyProviderJwt } from './verify-provider-jwt';

export const APPLE_ISSUER = 'https://appleid.apple.com';
export const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

export type AppleTokenInput = { identityToken: string };
/** 서버 간 알림 이벤트 — type: consent-revoked | account-delete | email-disabled | email-enabled */
export type AppleNotificationEvent = { type: string; sub: string };

/**
 * Apple identity token·서버 간 알림 JWT 검증 (둘 다 Apple JWKS 서명, aud = 번들 ID).
 * nonce는 쓰지 않는다 (ARCHITECTURE §11 소셜 로그인 — 클라이언트 생성 nonce는 효과 없음).
 */
@Injectable()
export class AppleTokenVerifier implements SocialTokenVerifier<AppleTokenInput> {
  private readonly bundleId: string;

  constructor(
    config: ConfigService,
    @Inject(APPLE_JWKS) private readonly jwks: Jwks,
  ) {
    this.bundleId = config.getOrThrow<string>('APPLE_BUNDLE_ID');
  }

  async verify({ identityToken }: AppleTokenInput): Promise<SocialIdentity> {
    const claims = await this.verifyJwt<{ email?: string }>(identityToken);
    if (!claims.sub || !claims.iat) {
      throw new BadRequestException('Invalid Apple token');
    }
    // 이름은 토큰에 없다 — 최초 로그인 때 앱이 받은 값을 본문으로 보낸다
    return {
      providerId: claims.sub,
      email: claims.email,
      issuedAt: new Date(claims.iat * 1000),
    };
  }

  async verifyNotification(payload: string): Promise<AppleNotificationEvent> {
    const claims = await this.verifyJwt<{ events?: string }>(payload);
    let event: Partial<AppleNotificationEvent>;
    try {
      event = JSON.parse(
        claims.events ?? '',
      ) as Partial<AppleNotificationEvent>;
    } catch {
      throw new BadRequestException('Invalid Apple notification');
    }
    if (typeof event.type !== 'string' || typeof event.sub !== 'string') {
      throw new BadRequestException('Invalid Apple notification');
    }
    return { type: event.type, sub: event.sub };
  }

  private verifyJwt<T extends object>(token: string) {
    return verifyProviderJwt<T>(
      token,
      this.jwks,
      { issuer: APPLE_ISSUER, audience: this.bundleId, algorithms: ['RS256'] },
      'Apple',
    );
  }
}
