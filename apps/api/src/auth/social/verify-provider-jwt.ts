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

/**
 * 제공자 서명 JWT 검증. 토큰 자체 문제(서명·클레임·만료·형식)는 400,
 * 공개키 조회 실패(제공자 장애·네트워크)는 503 — 앱이 재시도 여부를 구분할 수 있게.
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
    // 원격 JWKS fetch 실패는 JOSEError가 아닌 TypeError 등으로 올라온다
    if (e instanceof errors.JWKSTimeout || !(e instanceof errors.JOSEError)) {
      throw new ServiceUnavailableException(
        `${label} sign-in is temporarily unavailable`,
      );
    }
    throw new BadRequestException(`Invalid ${label} token`);
  }
}
