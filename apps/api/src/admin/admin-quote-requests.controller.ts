import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminQuoteRequestsService } from './admin-quote-requests.service';
import { CreateQuoteDto, UpdateQuoteDto } from './dto/create-quote.dto';

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
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.service.createQuote(id, dto);
  }

  @Patch(':id/quote')
  @ApiOperation({ summary: '[관리자] 견적 수정 — 결제 전(QUOTED)에만' })
  @ApiResponse({
    status: 409,
    description: 'QUOTED 상태가 아님 (결제 후 수정 불가)',
  })
  updateQuote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuoteDto,
  ) {
    return this.service.updateQuote(id, dto);
  }
}
