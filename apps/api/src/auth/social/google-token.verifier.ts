import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GOOGLE_JWKS,
  type Jwks,
  type SocialIdentity,
  type SocialTokenVerifier,
} from './social-identity';
import { verifyProviderJwt } from './verify-provider-jwt';

export const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

export type GoogleTokenInput = { idToken: string };

type GoogleClaims = {
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
};

/** Google ID 토큰 검증 — 앱 SDK에 webClientId를 설정하므로 aud는 Web 클라이언트 ID */
@Injectable()
export class GoogleTokenVerifier implements SocialTokenVerifier<GoogleTokenInput> {
  private readonly clientId: string | null;

  constructor(
    config: ConfigService,
    @Inject(GOOGLE_JWKS) private readonly jwks: Jwks,
  ) {
    this.clientId = config.get<string>('GOOGLE_WEB_CLIENT_ID') || null;
  }

  async verify({ idToken }: GoogleTokenInput): Promise<SocialIdentity> {
    if (!this.clientId) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }
    const claims = await verifyProviderJwt<GoogleClaims>(
      idToken,
      this.jwks,
      {
        issuer: ['accounts.google.com', 'https://accounts.google.com'],
        audience: this.clientId,
        algorithms: ['RS256'],
      },
      'Google',
    );
    if (!claims.sub || !claims.email || !claims.iat) {
      throw new BadRequestException('Invalid Google token');
    }
    // 검증되지 않은 이메일로 가입시키면 남의 이메일을 선점할 수 있다
    if (claims.email_verified !== true) {
      throw new BadRequestException('Google account email is not verified');
    }
    return {
      providerId: claims.sub,
      email: claims.email,
      firstName: claims.given_name?.slice(0, 50),
      lastName: claims.family_name?.slice(0, 50),
      issuedAt: new Date(claims.iat * 1000),
    };
  }
}
