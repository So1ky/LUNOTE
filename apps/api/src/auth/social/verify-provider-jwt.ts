import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  errors,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyOptions,
} from 'jose';
import type { Jwks } from './social-identity';

const TOKEN_ERRORS = [
  errors.JWTClaimValidationFailed,
  errors.JWTExpired, // jose 6에서는 JWTClaimValidationFailed의 하위 클래스가 아니다
  errors.JWSSignatureVerificationFailed,
  errors.JWSInvalid,
  errors.JWTInvalid,
  errors.JOSEAlgNotAllowed,
  errors.JOSENotSupported,
  errors.JWKSNoMatchingKey,
];

/**
 * 제공자 서명 JWT 검증. 토큰 자체 문제 클래스(서명·클레임·만료·형식·알고리즘·키 불일치)는 400,
 * 그 외 전부(공개키 조회 실패·제공자 5xx/429·네트워크)는 503 — 앱이 재시도 여부를 구분할 수 있게.
 * 401은 쓰지 않는다: 앱 api()는 401을 세션 만료로 보고 로그아웃시킨다.
 * 토큰 원문은 에러 메시지에 싣지 않는다.
 */
export async function verifyProviderJwt<T extends object>(
  token: string,
  jwks: Jwks,
  options: JWTVerifyOptions,
  label: string,
): Promise<T & JWTPayload> {
  try {
    const { payload } = await jwtVerify<T>(token, jwks, options);
    return payload;
  } catch (e) {
    // 허용 목록 방식: 토큰 문제로 확정된 에러만 400, 나머지는 제공자·네트워크 문제로 본다
    // (JWKS HTTP 오류는 일반 JOSEError, fetch 실패는 TypeError로 올라온다)
    if (!TOKEN_ERRORS.some((cls) => e instanceof cls)) {
      throw new ServiceUnavailableException(
        `${label} sign-in is temporarily unavailable`,
      );
    }
    throw new BadRequestException(`Invalid ${label} token`);
  }
}
