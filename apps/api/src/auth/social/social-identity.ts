import type { JWTVerifyGetKey } from 'jose';

/** 제공자가 검증해 준 신원 — 로그인·가입·탈퇴 재인증이 공유한다 */
export interface SocialIdentity {
  /** 제공자 사용자 식별자(sub) — User.providerId */
  providerId: string;
  /** Apple 재로그인 토큰에는 없을 수 있다 — 신규 가입에만 필수 */
  email?: string;
  firstName?: string;
  lastName?: string;
  /** 토큰 발급 시각(iat) — 탈퇴 재인증 신선도 검사용 */
  issuedAt: Date;
}

/** 제공자별 토큰 검증 전략 (프로젝트 규칙: 확장 포인트는 전략 패턴) */
export interface SocialTokenVerifier<TInput> {
  verify(input: TInput): Promise<SocialIdentity>;
}

/** 제공자 공개키 조회 함수 — 운영은 원격 JWKS, 테스트는 로컬 키셋을 주입한다 */
export type Jwks = JWTVerifyGetKey;
export const GOOGLE_JWKS = Symbol('GOOGLE_JWKS');
export const APPLE_JWKS = Symbol('APPLE_JWKS');
