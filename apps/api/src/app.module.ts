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
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { QuoteRequestsModule } from './quote-requests/quote-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // 처리되지 않은 예외를 Sentry로 보고 (DSN 미설정 시 no-op)
    SentryModule.forRoot(),
    // JSON 구조화 로그 + 요청별 request-id — Loki 수집 전제 (ARCHITECTURE §8)
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.getOrThrow<string>('LOG_LEVEL'),
          // 인증 헤더 등 민감값은 구조상 로그에 남지 않게 마스킹 (로그 규칙)
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          genReqId: (req) =>
            (req.headers['x-request-id'] as string) ?? randomUUID(),
          // 로컬은 사람이 읽는 포맷, 프로덕션은 JSON 그대로
          transport:
            config.get('NODE_ENV') === 'production'
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
        },
      }),
    }),
    // 전역 기본 제한. 인증 엔드포인트는 컨트롤러에서 @Throttle로 더 강하게 건다.
    // TODO: Pod을 여러 개 띄우면 인스턴스별 카운트가 되므로 Redis 스토리지로 교체 (A3)
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // BullMQ(ioredis)는 URL 대신 host/port 옵션을 받는다
        const url = new URL(config.getOrThrow<string>('REDIS_URL'));
        return {
          connection: { host: url.hostname, port: Number(url.port || 6379) },
        };
      },
    }),
    PrismaModule,
    StorageModule,
    NotificationsModule, // HealthController가 큐 상태 조회에 사용
    AuthModule,
    UsersModule,
    QuoteRequestsModule,
    AdminModule,
    AttachmentsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Sentry 필터가 바깥(먼저 등록) — Nest 기본 예외 처리 후 미처리 예외만 보고
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
