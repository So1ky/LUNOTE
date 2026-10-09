import {
  Controller,
  Body,
  Delete,
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
import { AdminUsersService } from './admin-users.service';
import { FindUserDto } from './dto/find-user.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  // 이메일을 URL 쿼리에 싣지 않는다 — 요청 로그(Loki)·트레이스(Tempo)에 남는다
  @Post('lookup')
  @HttpCode(200)
  @ApiOperation({
    summary: '[관리자] 이메일로 사용자 id 조회 (삭제 요청 처리용)',
  })
  @ApiResponse({
    status: 404,
    description: '없음 (탈퇴 사용자는 이메일이 익명화됨)',
  })
  findByEmail(@Body() dto: FindUserDto) {
    return this.service.findByEmail(dto.email);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[관리자] 계정 대행 삭제 — 감사 로그 기록' })
  @ApiResponse({ status: 403, description: '관리자 계정' })
  @ApiResponse({ status: 404, description: '없음 또는 이미 삭제' })
  @ApiResponse({ status: 409, description: '결제 완료·진행 중 문의 존재' })
  deleteUser(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.deleteUser(id, admin.id);
  }
}
