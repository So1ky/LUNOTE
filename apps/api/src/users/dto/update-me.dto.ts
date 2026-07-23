import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/** 앱이 지원하는 언어 (표시 문구 i18n은 별도 트랙) */
export const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh', 'es', 'de'] as const;

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Mina Kim', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ enum: SUPPORTED_LANGUAGES, example: 'ko' })
  @IsOptional()
  @IsIn(SUPPORTED_LANGUAGES)
  language?: string;

  @ApiPropertyOptional({
    description: 'attachments/presign으로 업로드한 이미지의 s3Key',
    example: 'uploads/<userId>/<uuid>/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  // 경로 형식만 1차 검증 — 소유권(내 프리픽스인지)은 서비스에서 확인
  @Matches(/^uploads\//)
  avatarS3Key?: string;

  @ApiPropertyOptional({ description: '견적 도착 이메일 수신 여부' })
  @IsOptional()
  @IsBoolean()
  quoteEmailEnabled?: boolean;
}
