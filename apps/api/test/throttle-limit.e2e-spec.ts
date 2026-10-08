import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

// 전역 한도가 설정값으로 동작하는지 — 로컬 docker compose(PostgreSQL·Redis) 필요
describe('전역 rate limit 한도 설정 (e2e)', () => {
  let app: INestApplication<App>;
  const previous = process.env.THROTTLE_DEFAULT_LIMIT;

  beforeAll(async () => {
    process.env.THROTTLE_DEFAULT_LIMIT = '3';
    // ts-jest(CommonJS)는 동적 import()를 지원하지 않아 지연 require로 대체한다
    const { AppModule } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./../src/app.module') as typeof import('./../src/app.module');
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (previous === undefined) delete process.env.THROTTLE_DEFAULT_LIMIT;
    else process.env.THROTTLE_DEFAULT_LIMIT = previous;
  });

  it('한도 3이면 4번째 요청은 429 — 전역 가드가 인증 가드보다 먼저 돈다', async () => {
    const server = app.getHttpServer();
    for (let i = 0; i < 3; i++) {
      await request(server).get('/quote-requests').expect(401);
    }
    await request(server).get('/quote-requests').expect(429);
  });
});
