import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { NOTIFICATIONS_QUEUE } from './../src/notifications/notifications.service';

describe('Notifications (e2e)', () => {
  let app: INestApplication<App>;
  let queue: Queue;
  const stamp = Date.now();

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
    queue = app.get<Queue>(getQueueToken(NOTIFICATIONS_QUEUE));
  });

  afterAll(async () => {
    await app.close();
  });

  it('문의 등록 시 관리자 알림 잡이 처리된다', async () => {
    const before = await queue.getJobCounts('completed');

    const signup = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: `noti-${stamp}@test.lunote.app`,
        password: 'test-password-123',
      })
      .expect(201);
    const token = (signup.body as { accessToken: string }).accessToken;

    await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'BANK',
        description: 'Need help opening a bank account as a foreigner.',
        contactMethod: 'email: noti@test.com',
      })
      .expect(201);

    // 워커가 잡을 소비할 때까지 대기 (로그 폴백 채널이므로 즉시 완료됨)
    const deadline = Date.now() + 10_000;
    let completedDelta = 0;
    while (Date.now() < deadline) {
      const counts = await queue.getJobCounts('completed');
      completedDelta = counts.completed - before.completed;
      if (completedDelta >= 1) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    expect(completedDelta).toBeGreaterThanOrEqual(1);
  });
});
