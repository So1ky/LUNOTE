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
      const error = await this.errorCode(res);
      // invalid_grant만 사용자 문제(만료·재사용 code). invalid_client 등은 서버 설정 오류
      if (error === 'invalid_grant') {
        throw new BadRequestException(
          'Apple confirmation expired — please try again',
        );
      }
      this.logger.error(`Apple 토큰 교환 실패 status=400 error=${error}`);
      throw new ServiceUnavailableException(
        'Could not confirm with Apple — please try again',
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
    let refreshToken: string | undefined;
    try {
      refreshToken = ((await res.json()) as { refresh_token?: string })
        .refresh_token;
    } catch {
      this.logger.error('Apple 토큰 교환 응답 파싱 실패');
    }
    if (!refreshToken) {
      this.logger.error('Apple 토큰 교환 응답에 refresh_token 없음');
      throw new ServiceUnavailableException(
        'Could not confirm with Apple — please try again',
      );
    }
    return refreshToken;
  }

  /** 연결 해제 — 최대 3회. 절대 던지지 않는다: 최종 실패·설정 오류는 false (계정은 이미 삭제됐으므로 호출자가 기록만 한다) */
  async revoke(refreshToken: string): Promise<boolean> {
    for (let attempt = 1; attempt <= REVOKE_ATTEMPTS; attempt++) {
      let res: Response | null;
      try {
        res = await this.post(APPLE_REVOKE_URL, {
          token: refreshToken,
          token_type_hint: 'refresh_token',
        });
      } catch {
        // client_secret 생성 실패(설정 오류) — 재시도해도 같으므로 즉시 포기
        return false;
      }
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

  /** 400 응답 본문의 error 코드(민감하지 않음). 파싱 실패 시 'unknown' */
  private async errorCode(res: Response): Promise<string> {
    try {
      const { error } = (await res.json()) as { error?: unknown };
      return typeof error === 'string' ? error : 'unknown';
    } catch {
      return 'unknown';
    }
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
    try {
      const key = await importPKCS8(this.privateKey, 'ES256');
      return await new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', kid: this.keyId })
        .setIssuer(this.teamId)
        .setSubject(this.bundleId)
        .setAudience(APPLE_ISSUER)
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(key);
    } catch (e) {
      // 키 형식 오류 등 — 원문(키 조각이 섞일 수 있음) 대신 에러 이름만 기록
      this.logger.error(`Apple client_secret 생성 실패 ${(e as Error).name}`);
      throw new ServiceUnavailableException('Apple sign-in is not configured');
    }
  }
}
