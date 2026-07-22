import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { QuoteRequestsService } from './quote-requests.service';

@ApiTags('quote-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quote-requests')
export class QuoteRequestsController {
  constructor(private readonly service: QuoteRequestsService) {}

  @Post()
  @ApiOperation({ summary: '문의 등록' })
  @ApiResponse({ status: 201, description: '등록된 문의 반환 (REVIEWING)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuoteRequestDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '내 문의 목록 (최신순, 견적 요약 포함)' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.service.findMine(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '문의 상세' })
  @ApiResponse({ status: 404, description: '없거나 내 문의가 아님' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(user.id, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '문의 취소 (REVIEWING/QUOTED 상태에서만)' })
  @ApiResponse({ status: 409, description: '취소 불가능한 상태' })
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(user.id, id);
  }
}
