import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';

import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { validateEnv } from './config/env.validation';
import { redisConnectionFromUrl } from './config/redis-connection';
import { FailOpenThrottlerStorage } from './config/throttler-storage';
import { HealthController } from './health/health.controller';
import { ObservabilityModule } from './observability/observability.module';
import { traceLogFields } from './observability/trace-log-fields';
import { PrismaModule } from './prisma/prisma.module';
import { QuoteRequestsModule } from './quote-requests/quote-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // 처리되지 않은 예외를 Sentry로 보고 (DSN 미설정 시 no-op)
    SentryModule.forRoot(),
    // 비즈니스 카운터(MetricsService) — 전역 주입
    ObservabilityModule,
    // JSON 구조화 로그 + 요청별 request-id — Loki 수집 전제 (ARCHITECTURE §8)
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.getOrThrow<string>('LOG_LEVEL'),
          // 로그 한 줄 → 그 요청의 트레이스로 점프. 유효한 스팬이 없으면 필드 없음
          mixin: () => traceLogFields(),
          // 인증 헤더 등 민감값은 구조상 로그에 남지 않게 마스킹 (로그 규칙)
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          genReqId: (req) =>
            (req.headers['x-request-id'] as string) ?? randomUUID(),
          // 로컬은 사람이 읽는 포맷, 프로덕션은 JSON 그대로.
          // 테스트(jest가 NODE_ENV=test 설정)도 transport 없이 — 앱마다 워커 스레드가 생기고 app.close()가
          // 끝내지 않아, 가끔 하나가 ref로 남아 jest가 종료되지 않는다 (CI 빌드 #67 실측)
          transport: ['production', 'test'].includes(
            config.get<string>('NODE_ENV') ?? '',
          )
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        },
      }),
    }),
    // 전역 기본 제한. 인증 엔드포인트는 컨트롤러에서 @Throttle로 더 강하게 건다. 한도는 THROTTLE_DEFAULT_LIMIT(기본 100, env.validation.ts).
    // 프로덕션은 카운터를 Redis에 둔다 — Pod마다 따로 세면 한도가 Pod 수만큼 느슨해진다.
    // 로컬·테스트는 인메모리: 테스트는 스위트마다 앱을 새로 만들어 카운터가 초기화되는 것에 의존한다.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60_000,
            limit: Number(config.getOrThrow<string>('THROTTLE_DEFAULT_LIMIT')),
          },
        ],
        storage:
          config.get('NODE_ENV') === 'production'
            ? new FailOpenThrottlerStorage(
                config.getOrThrow<string>('REDIS_URL'),
              )
            : undefined,
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: redisConnectionFromUrl(
          config.getOrThrow<string>('REDIS_URL'),
        ),
      }),
    }),
    PrismaModule,
    StorageModule,
    NotificationsModule, // HealthController가 큐 상태 조회에 사용
    AuthModule,
    UsersModule,
    QuoteRequestsModule,
    AdminModule,
    AttachmentsModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Sentry 필터가 바깥(먼저 등록) — Nest 기본 예외 처리 후 미처리 예외만 보고
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
