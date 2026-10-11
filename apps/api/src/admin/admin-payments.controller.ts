import {
  Controller,
  HttpCode,
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
import { UserRole } from '@prisma/client';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaymentsService } from '../payments/payments.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(':id/confirm-transfer')
  @HttpCode(200)
  @ApiOperation({
    summary: '수동 계좌이체 입금 확인 → PAID (멱등, 관리자 전용)',
  })
  @ApiResponse({ status: 200, description: '{ outcome: paid|noop, payment }' })
  @ApiResponse({ status: 404, description: '결제 없음' })
  @ApiResponse({ status: 409, description: 'NOT_BANK_TRANSFER / NOT_PENDING' })
  confirmTransfer(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payments.confirmBankTransfer(id, user.id);
  }
}
