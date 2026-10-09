import { Module } from '@nestjs/common';
import { createRemoteJWKSet } from 'jose';
import { GOOGLE_JWKS_URL, GoogleTokenVerifier } from './google-token.verifier';
import { GOOGLE_JWKS } from './social-identity';

/** 소셜 제공자 검증·연동 — 로그인(AuthModule)과 탈퇴 재인증(UsersModule)이 공유한다 */
@Module({
  providers: [
    // jose가 공개키를 캐시하고 kid 미스 시에만 재조회한다
    {
      provide: GOOGLE_JWKS,
      useFactory: () => createRemoteJWKSet(new URL(GOOGLE_JWKS_URL)),
    },
    GoogleTokenVerifier,
  ],
  exports: [GoogleTokenVerifier],
})
export class SocialAuthModule {}
