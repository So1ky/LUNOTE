import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequestStatus, UserRole } from '@prisma/client';
import { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminQuoteRequestsService } from './admin-quote-requests.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/quote-requests')
export class AdminQuoteRequestsController {
  constructor(private readonly service: AdminQuoteRequestsService) {}

  @Get()
  @ApiOperation({ summary: '[관리자] 전체 문의 목록' })
  @ApiQuery({ name: 'status', enum: RequestStatus, required: false })
  @ApiResponse({ status: 403, description: '관리자 아님' })
  findAll(
    @Query('status', new ParseEnumPipe(RequestStatus, { optional: true }))
    status?: RequestStatus,
  ) {
    return this.service.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: '[관리자] 문의 상세 (사용자 정보 포함)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/quote')
  @ApiOperation({ summary: '[관리자] 견적 발송 — REVIEWING → QUOTED' })
  @ApiResponse({
    status: 409,
    description: '이미 견적 존재 또는 REVIEWING 아님',
  })
  createQuote(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.service.createQuote(id, dto, admin.id);
  }

  // 견적 수정 라우트는 제공하지 않는다 — 발행 후 불변 (제품 결정 2026-07-24)
}
