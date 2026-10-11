import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { EmailVerifiedGuard } from '../auth/email-verified.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  @ApiOperation({
    summary:
      '결제 의도 생성 — 앱이 결제 UI를 띄울 값 반환 (금액은 서버 견적 기준)',
  })
  @ApiResponse({ status: 404, description: '견적 없음/내 견적 아님' })
  @ApiResponse({
    status: 409,
    description: 'QUOTE_NOT_PAYABLE | QUOTE_EXPIRED | UNSUPPORTED_CURRENCY',
  })
  @ApiResponse({
    status: 503,
    description: 'PAYMENTS_NOT_CONFIGURED (로컬 미설정)',
  })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.service.createIntent(user.id, dto.quoteId);
  }

  @Get(':id')
  @ApiOperation({ summary: '내 결제 상태 조회' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(user.id, id);
  }

  @Post(':id/confirm')
  @ApiOperation({
    summary:
      '앱 콜백 후 확인 — PortOne 조회 API로 재검증해 상태 반영 (웹훅과 멱등)',
  })
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.confirm(user.id, id);
  }
}
