import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppleAuthClient } from './../src/auth/social/apple-auth.client';
import { AppleTokenVerifier } from './../src/auth/social/apple-token.verifier';
import { GoogleTokenVerifier } from './../src/auth/social/google-token.verifier';
import { PrismaService } from './../src/prisma/prisma.service';
import {
  fakeAppleVerifier,
  fakeGoogleVerifier,
  fakeToken,
} from './support/fake-social';

// DELETE /users/me는 분당 5회 제한이라 social-delete-apple과 파일을 분리했다
describe('Social account deletion — Apple code/account mismatch (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const stamp = Date.now();
  const appleAuth = { exchangeCode: jest.fn(), revoke: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleTokenVerifier)
      .useValue(fakeGoogleVerifier)
      .overrideProvider(AppleTokenVerifier)
      .useValue(fakeAppleVerifier)
      .overrideProvider(AppleAuthClient)
      .useValue(appleAuth)
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('교환한 code의 sub가 다른 계정 → 400, 계정 그대로, revoke 안 함', async () => {
    const sub = `ad-mismatch-${stamp}`;
    appleAuth.exchangeCode.mockResolvedValue({
      refreshToken: 'other-refresh',
      sub: `someone-else-${stamp}`,
    });
    const join = await request(app.getHttpServer())
      .post('/auth/apple')
      .send({
        identityToken: fakeToken(sub, `${sub}@privaterelay.appleid.com`),
        termsAccepted: true,
      })
      .expect(200);
    const { accessToken } = join.body as { accessToken: string };

    await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ identityToken: fakeToken(sub), authorizationCode: `code-${sub}` })
      .expect(400);

    const user = await prisma.user.findFirst({
      where: { provider: AuthProvider.APPLE, providerId: sub },
    });
    expect(user?.deletedAt).toBeNull();
    expect(appleAuth.revoke).not.toHaveBeenCalled();
  });
});
