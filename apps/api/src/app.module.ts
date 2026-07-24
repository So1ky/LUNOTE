import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AdminModule } from './admin/admin.module';
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
    AuthModule,
    UsersModule,
    QuoteRequestsModule,
    AdminModule,
    AttachmentsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
