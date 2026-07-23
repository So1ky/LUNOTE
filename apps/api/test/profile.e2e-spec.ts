import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Profile settings (e2e)', () => {
  let app: INestApplication<App>;
  const stamp = Date.now();
  const email = `profile-${stamp}@test.lunote.app`;
  const password = 'profile-password-1';
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password, firstName: 'Before', lastName: 'Name' })
      .expect(201);
    token = (res.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/me가 프로필 필드(언어/아바타)를 포함한다', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const body = res.body as {
      language: string | null;
      avatarUrl: string | null;
    };
    expect(body.language).toBeNull();
    expect(body.avatarUrl).toBeNull();
  });

  it('이름/언어/알림 설정 수정', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'After', lastName: 'Name', language: 'ja' })
      .expect(200);
    const body = res.body as {
      firstName: string;
      lastName: string;
      language: string;
    };
    expect(body.firstName).toBe('After');
    expect(body.lastName).toBe('Name');
    expect(body.language).toBe('ja');
  });

  it('지원하지 않는 언어는 400', () => {
    return request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'fr' })
      .expect(400);
  });

  it('타인 프리픽스의 avatarS3Key는 403', () => {
    return request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarS3Key: 'uploads/someone-else/x/avatar.jpg' })
      .expect(403);
  });

  it('비밀번호 변경: 현재 비밀번호 틀리면 400, 맞으면 새 비밀번호로만 로그인', async () => {
    await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong-password', newPassword: 'next-password-1' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'next-password-1' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'next-password-1' })
      .expect(200);
  });
});
