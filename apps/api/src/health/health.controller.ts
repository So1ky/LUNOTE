import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '서비스 상태 확인 (DB 필수, Redis는 참고용)' })
  @ApiResponse({
    status: 200,
    description: '{ status: "ok", db: "up", queue: "up" | "down" }',
  })
  @ApiResponse({ status: 503, description: 'DB 연결 실패' })
  async check() {
    // DB는 필수 — 실패 시 503 (트래픽 차단). Redis는 이메일 큐 전용이라
    // 죽어도 핵심 기능(문의/견적/인앱 알림)은 동작하므로 상태만 노출한다.
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
    const queue = (await this.notifications.isQueueUp()) ? 'up' : 'down';
    return { status: 'ok', db: 'up', queue };
  }
}
