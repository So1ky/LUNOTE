import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { EmailVerifiedGuard } from '../auth/email-verified.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { PresignDto } from './dto/presign.dto';

@ApiTags('attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly storage: StorageService) {}

  @Post('presign')
  @ApiOperation({
    summary: '업로드용 presigned URL 발급 (이미지/PDF, 최대 10MB)',
  })
  @ApiResponse({ status: 400, description: '허용되지 않는 형식/용량' })
  async presign(@CurrentUser() user: AuthUser, @Body() dto: PresignDto) {
    // 키에 userId 프리픽스 — 문의 생성 시 소유권 검증의 근거가 된다
    const s3Key = `uploads/${user.id}/${randomUUID()}/${dto.fileName}`;
    const uploadUrl = await this.storage.presignUpload(s3Key, dto.mimeType);
    return { s3Key, uploadUrl };
  }
}
