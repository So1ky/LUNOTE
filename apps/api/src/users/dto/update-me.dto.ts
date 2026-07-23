import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/** 앱이 지원하는 언어 (표시 문구 i18n은 별도 트랙) */
export const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh', 'es', 'de'] as const;

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Mina', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Kim', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

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
}
