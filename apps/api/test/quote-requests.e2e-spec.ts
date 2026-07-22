import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('QuoteRequests (e2e)', () => {
  let app: INestApplication<App>;
  const stamp = Date.now();
  const password = 'test-password-123';
  let tokenA: string; // 문의 소유자
  let tokenB: string; // 남의 문의에 접근을 시도하는 사용자
  let requestId: number;

  const signup = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email, password })
      .expect(201);
    return (res.body as { accessToken: string }).accessToken;
  };

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

    tokenA = await signup(`qr-owner-${stamp}@test.lunote.app`);
    tokenB = await signup(`qr-other-${stamp}@test.lunote.app`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /quote-requests — 토큰 없으면 401', () => {
    return request(app.getHttpServer())
      .post('/quote-requests')
      .send({
        category: 'HOUSING',
        description: 'x'.repeat(20),
        contactMethod: 'email: a@b.c',
      })
      .expect(401);
  });

  it('POST /quote-requests — 등록하면 REVIEWING 상태로 생성', async () => {
    const res = await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        category: 'HOUSING',
        desiredAmount: 400,
        description: 'Looking for a one-room near Hongdae, budget $400/month.',
        contactMethod: 'email: owner@test.com',
      })
      .expect(201);

    const body = res.body as {
      id: number;
      status: string;
      currency: string;
      quote: unknown;
    };
    requestId = body.id;
    expect(body.status).toBe('REVIEWING');
    expect(body.currency).toBe('USD'); // 기본값
    expect(body.quote).toBeNull(); // 아직 견적 없음
  });

  it('POST /quote-requests — 잘못된 카테고리는 400', () => {
    return request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        category: 'NOT_A_CATEGORY',
        description: 'long enough description here',
        contactMethod: 'email: a@b.c',
      })
      .expect(400);
  });

  it('GET /quote-requests — 내 목록에는 내 문의만 보인다', async () => {
    const resA = await request(app.getHttpServer())
      .get('/quote-requests')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const listA = resA.body as { id: number }[];
    expect(listA.some((r) => r.id === requestId)).toBe(true);

    const resB = await request(app.getHttpServer())
      .get('/quote-requests')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    const listB = resB.body as { id: number }[];
    expect(listB.some((r) => r.id === requestId)).toBe(false);
  });

  it('GET /quote-requests/:id — 소유자는 조회 가능', async () => {
    const res = await request(app.getHttpServer())
      .get(`/quote-requests/${requestId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect((res.body as { id: number }).id).toBe(requestId);
  });

  it('GET /quote-requests/:id — 타인은 404 (IDOR 방지, 403이 아니라 404)', () => {
    return request(app.getHttpServer())
      .get(`/quote-requests/${requestId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('PATCH /:id/cancel — 타인은 404', () => {
    return request(app.getHttpServer())
      .patch(`/quote-requests/${requestId}/cancel`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('PATCH /:id/cancel — 소유자는 REVIEWING 상태에서 취소 가능', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/quote-requests/${requestId}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect((res.body as { status: string }).status).toBe('CANCELLED');
  });

  it('PATCH /:id/cancel — 이미 취소된 문의는 409', () => {
    return request(app.getHttpServer())
      .patch(`/quote-requests/${requestId}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(409);
  });
});
