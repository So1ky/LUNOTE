import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createLocalJWKSet,
  errors,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTPayload,
} from 'jose';
import { AppleTokenVerifier } from './apple-token.verifier';
import { GoogleTokenVerifier } from './google-token.verifier';
import type { Jwks } from './social-identity';

const GOOGLE_CLIENT = 'web-client.apps.googleusercontent.com';

let privateKey: CryptoKey;
let jwks: Jwks;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  jwks = createLocalJWKSet({
    keys: [{ ...(await exportJWK(pair.publicKey)), kid: 'test', alg: 'RS256' }],
  });
});

const config = (values: Record<string, string>) =>
  ({
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      if (!values[key]) throw new Error(`missing ${key}`);
      return values[key];
    },
  }) as unknown as ConfigService;

/** 테스트 키로 서명한 토큰. exp/iat는 초 단위 절대값으로 덮어쓸 수 있다 */
const sign = (
  claims: JWTPayload,
  opts: { iss: string; aud: string; sub?: string; iat?: number; exp?: number },
) => {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setSubject(opts.sub ?? 'sub-1')
    .setIssuer(opts.iss)
    .setAudience(opts.aud)
    .setIssuedAt(opts.iat ?? now)
    .setExpirationTime(opts.exp ?? now + 300)
    .sign(privateKey);
};

const failingJwks: Jwks = () => Promise.reject(new TypeError('fetch failed'));

describe('GoogleTokenVerifier', () => {
  const verifier = () =>
    new GoogleTokenVerifier(
      config({ GOOGLE_WEB_CLIENT_ID: GOOGLE_CLIENT }),
      jwks,
    );
  const googleToken = (
    claims: JWTPayload,
    opts: Partial<Parameters<typeof sign>[1]> = {},
  ) =>
    sign(
      {
        email: 'mina@gmail.com',
        email_verified: true,
        given_name: 'Mina',
        family_name: 'Kim',
        ...claims,
      },
      { iss: 'https://accounts.google.com', aud: GOOGLE_CLIENT, ...opts },
    );

  it('유효한 토큰 → 신원', async () => {
    const identity = await verifier().verify({
      idToken: await googleToken({}),
    });
    expect(identity).toMatchObject({
      providerId: 'sub-1',
      email: 'mina@gmail.com',
      firstName: 'Mina',
      lastName: 'Kim',
    });
    expect(identity.issuedAt).toBeInstanceOf(Date);
  });

  it('iss가 accounts.google.com(스킴 없음)이어도 통과', async () => {
    const idToken = await googleToken({}, { iss: 'accounts.google.com' });
    await expect(verifier().verify({ idToken })).resolves.toBeDefined();
  });

  it('aud가 다른 클라이언트면 400', async () => {
    const idToken = await googleToken(
      {},
      { aud: 'other.apps.googleusercontent.com' },
    );
    await expect(verifier().verify({ idToken })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('iss가 Google이 아니면 400', async () => {
    const idToken = await googleToken({}, { iss: 'https://evil.example' });
    await expect(verifier().verify({ idToken })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('만료 토큰은 400', async () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const idToken = await googleToken({}, { iat: past - 60, exp: past });
    await expect(verifier().verify({ idToken })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('형식이 깨진 토큰은 400', async () => {
    await expect(
      verifier().verify({ idToken: 'not-a-jwt' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('다른 키로 서명된 토큰은 400', async () => {
    const other = await generateKeyPair('RS256');
    const now = Math.floor(Date.now() / 1000);
    const idToken = await new SignJWT({
      email: 'a@gmail.com',
      email_verified: true,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test' })
      .setSubject('sub-1')
      .setIssuer('https://accounts.google.com')
      .setAudience(GOOGLE_CLIENT)
      .setIssuedAt(now)
      .setExpirationTime(now + 300)
      .sign(other.privateKey);
    await expect(verifier().verify({ idToken })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('email_verified가 true가 아니면 400 — 남의 이메일 선점 방지', async () => {
    const idToken = await googleToken({ email_verified: false });
    await expect(verifier().verify({ idToken })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('공개키 조회 실패는 503', async () => {
    const v = new GoogleTokenVerifier(
      config({ GOOGLE_WEB_CLIENT_ID: GOOGLE_CLIENT }),
      failingJwks,
    );
    await expect(
      v.verify({ idToken: await googleToken({}) }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('JWKS HTTP 오류(일반 JOSEError)는 503', async () => {
    const httpErrorJwks: Jwks = () =>
      Promise.reject(
        new errors.JOSEError(
          'Expected 200 OK from the JSON Web Key Set HTTP response',
        ),
      );
    const v = new GoogleTokenVerifier(
      config({ GOOGLE_WEB_CLIENT_ID: GOOGLE_CLIENT }),
      httpErrorJwks,
    );
    await expect(
      v.verify({ idToken: await googleToken({}) }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('RS256이 아닌 alg(HS256)로 서명된 토큰은 400 — 알고리즘 고정', async () => {
    const now = Math.floor(Date.now() / 1000);
    const idToken = await new SignJWT({
      email: 'a@gmail.com',
      email_verified: true,
    })
      .setProtectedHeader({ alg: 'HS256', kid: 'test' })
      .setSubject('sub-1')
      .setIssuer('https://accounts.google.com')
      .setAudience(GOOGLE_CLIENT)
      .setIssuedAt(now)
      .setExpirationTime(now + 300)
      .sign(new TextEncoder().encode('x'.repeat(32)));
    await expect(verifier().verify({ idToken })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('GOOGLE_WEB_CLIENT_ID 미설정(로컬)이면 503', async () => {
    const v = new GoogleTokenVerifier(config({}), jwks);
    await expect(
      v.verify({ idToken: await googleToken({}) }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

const BUNDLE = 'com.lunoteapp';
const APPLE_ISS = 'https://appleid.apple.com';

describe('AppleTokenVerifier', () => {
  const verifier = (j: Jwks = jwks) =>
    new AppleTokenVerifier(config({ APPLE_BUNDLE_ID: BUNDLE }), j);

  it('유효한 identity token → 신원 (이름은 토큰에 없다)', async () => {
    const identityToken = await sign(
      { email: 'abc@privaterelay.appleid.com' },
      { iss: APPLE_ISS, aud: BUNDLE },
    );
    await expect(verifier().verify({ identityToken })).resolves.toMatchObject({
      providerId: 'sub-1',
      email: 'abc@privaterelay.appleid.com',
    });
  });

  it('email 클레임이 없어도 신원은 반환 (기존 사용자 재로그인)', async () => {
    const identityToken = await sign({}, { iss: APPLE_ISS, aud: BUNDLE });
    const identity = await verifier().verify({ identityToken });
    expect(identity.providerId).toBe('sub-1');
    expect(identity.email).toBeUndefined();
  });

  it('aud가 번들 ID가 아니면 400', async () => {
    const identityToken = await sign(
      {},
      { iss: APPLE_ISS, aud: 'com.other.app' },
    );
    await expect(verifier().verify({ identityToken })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('iss가 Apple이 아니면 400', async () => {
    const identityToken = await sign(
      {},
      { iss: 'https://evil.example', aud: BUNDLE },
    );
    await expect(verifier().verify({ identityToken })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('공개키 조회 실패는 503', async () => {
    const identityToken = await sign({}, { iss: APPLE_ISS, aud: BUNDLE });
    await expect(
      verifier(failingJwks).verify({ identityToken }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  describe('verifyNotification', () => {
    const notification = (events: unknown) =>
      sign(
        {
          events: typeof events === 'string' ? events : JSON.stringify(events),
        },
        { iss: APPLE_ISS, aud: BUNDLE },
      );

    it('events(JSON 문자열)에서 type·sub 추출', async () => {
      const payload = await notification({
        type: 'consent-revoked',
        sub: 'apple-sub-9',
        event_time: 1,
      });
      await expect(verifier().verifyNotification(payload)).resolves.toEqual({
        type: 'consent-revoked',
        sub: 'apple-sub-9',
      });
    });

    it('events가 JSON이 아니면 400', async () => {
      const payload = await notification('not-json');
      await expect(
        verifier().verifyNotification(payload),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('type·sub가 없으면 400', async () => {
      const payload = await notification({ event_time: 1 });
      await expect(
        verifier().verifyNotification(payload),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('events가 객체가 아닌 JSON(null)이면 400', async () => {
      const payload = await notification('null');
      await expect(
        verifier().verifyNotification(payload),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('type은 있고 sub가 없으면 400', async () => {
      const payload = await notification({ type: 'consent-revoked' });
      await expect(
        verifier().verifyNotification(payload),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('위조 서명은 400', async () => {
      const other = await generateKeyPair('RS256');
      const now = Math.floor(Date.now() / 1000);
      const payload = await new SignJWT({
        events: JSON.stringify({ type: 'account-delete', sub: 'x' }),
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'test' })
        .setIssuer(APPLE_ISS)
        .setAudience(BUNDLE)
        .setIssuedAt(now)
        .setExpirationTime(now + 300)
        .sign(other.privateKey);
      await expect(
        verifier().verifyNotification(payload),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
