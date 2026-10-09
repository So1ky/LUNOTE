import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { importPKCS8, SignJWT } from 'jose';
import { APPLE_ISSUER } from './apple-token.verifier';

const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const REQUEST_TIMEOUT_MS = 5_000;
const REVOKE_ATTEMPTS = 3;
const RETRY_DELAY_MS = 300;

/**
 * Sign in with Apple REST — 탈퇴 시 연결 해제(App Store 5.1.1(v))에만 쓴다.
 * Apple 토큰은 저장하지 않는다: 재인증 code를 교환해 즉시 revoke (ARCHITECTURE §11).
 * 토큰·code는 로그에 남기지 않는다 — 상태 코드만 기록.
 */
@Injectable()
export class AppleAuthClient {
  private readonly logger = new Logger(AppleAuthClient.name);
  private readonly bundleId: string;
  private readonly teamId: string | null;
  private readonly keyId: string | null;
  private readonly privateKey: string | null;

  constructor(config: ConfigService) {
    this.bundleId = config.getOrThrow<string>('APPLE_BUNDLE_ID');
    this.teamId = config.get<string>('APPLE_TEAM_ID') || null;
    this.keyId = config.get<string>('APPLE_KEY_ID') || null;
    // .env 한 줄 형식(\n 이스케이프)과 Secrets Manager 여러 줄 형식을 모두 받는다
    this.privateKey =
      config.get<string>('APPLE_PRIVATE_KEY')?.replace(/\\n/g, '\n') || null;
  }

  /** authorizationCode(5분·1회용) → Apple refresh token. 탈퇴 전 단계라 실패해도 상태 변경 없음 */
  async exchangeCode(code: string): Promise<string> {
    const res = await this.post(APPLE_TOKEN_URL, {
      grant_type: 'authorization_code',
      code,
    });
    if (res?.status === 400) {
      // invalid_grant — 만료되거나 이미 쓴 code. 앱이 재인증을 다시 하면 된다
      throw new BadRequestException(
        'Apple confirmation expired — please try again',
      );
    }
    if (!res?.ok) {
      this.logger.error(
        `Apple 토큰 교환 실패 status=${res?.status ?? 'network'}`,
      );
      throw new ServiceUnavailableException(
        'Could not confirm with Apple — please try again',
      );
    }
    const body = (await res.json()) as { refresh_token?: string };
    if (!body.refresh_token) {
      this.logger.error('Apple 토큰 교환 응답에 refresh_token 없음');
      throw new ServiceUnavailableException(
        'Could not confirm with Apple — please try again',
      );
    }
    return body.refresh_token;
  }

  /** 연결 해제 — 최대 3회. 최종 실패는 false (계정은 이미 삭제됐으므로 호출자가 기록만 한다) */
  async revoke(refreshToken: string): Promise<boolean> {
    for (let attempt = 1; attempt <= REVOKE_ATTEMPTS; attempt++) {
      const res = await this.post(APPLE_REVOKE_URL, {
        token: refreshToken,
        token_type_hint: 'refresh_token',
      });
      if (res?.ok) return true;
      this.logger.warn(
        `Apple revoke 실패 attempt=${attempt} status=${res?.status ?? 'network'}`,
      );
      if (attempt < REVOKE_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
    return false;
  }

  /** 네트워크 실패·타임아웃은 null — 호출자가 상태 코드와 함께 판단 */
  private async post(
    url: string,
    params: Record<string, string>,
  ): Promise<Response | null> {
    const body = new URLSearchParams({
      ...params,
      client_id: this.bundleId,
      client_secret: await this.clientSecret(),
    });
    try {
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      return null;
    }
  }

  /** client_secret = .p8로 서명한 ES256 JWT. 요청마다 새로 만든다(5분 유효) */
  private async clientSecret(): Promise<string> {
    if (!this.teamId || !this.keyId || !this.privateKey) {
      throw new ServiceUnavailableException('Apple sign-in is not configured');
    }
    const key = await importPKCS8(this.privateKey, 'ES256');
    return new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: this.keyId })
      .setIssuer(this.teamId)
      .setSubject(this.bundleId)
      .setAudience(APPLE_ISSUER)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(key);
  }
}
