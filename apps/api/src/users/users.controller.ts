import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeleteMeDto } from './dto/delete-me.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 프로필 (아바타 URL 포함)' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.users.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: '내 프로필 수정 — 이름/언어/아바타/알림 설정' })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user.id, dto);
  }

  @Delete('me')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({
    summary:
      '계정 삭제 — 가입 방식으로 재인증(EMAIL 비밀번호 / GOOGLE idToken / APPLE identityToken+authorizationCode), 익명화 + 결제 기록 보존',
  })
  @ApiResponse({
    status: 400,
    description: '재인증 실패(불일치·5분 초과·방식 불일치)',
  })
  @ApiResponse({ status: 403, description: '관리자 계정' })
  @ApiResponse({ status: 409, description: '결제 완료·진행 중 문의 존재' })
  @ApiResponse({
    status: 503,
    description: 'Google·Apple 확인 실패(제공자 장애)',
  })
  deleteMe(@CurrentUser() user: AuthUser, @Body() dto: DeleteMeDto) {
    return this.users.deleteMe(user.id, dto);
  }
}
