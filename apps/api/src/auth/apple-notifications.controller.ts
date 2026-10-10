import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppleNotificationsService } from './apple-notifications.service';
import { AppleNotificationDto } from './dto/apple-notification.dto';

// Apple 콘솔에 등록하는 주소는 번들 ID당 1개 — prod(api.lunoteapp.com)만 실제 알림을 받는다
@ApiTags('auth')
@Controller('auth/apple')
export class AppleNotificationsController {
  constructor(private readonly notifications: AppleNotificationsService) {}

  @Post('notifications')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Sign in with Apple 서버 간 알림 (consent-revoked·account-delete·email-*)',
  })
  @ApiResponse({ status: 200, description: '처리 또는 무시(사용자 없음)' })
  @ApiResponse({ status: 400, description: '서명·클레임 검증 실패' })
  handle(@Body() dto: AppleNotificationDto) {
    return this.notifications.handle(dto.payload);
  }
}
