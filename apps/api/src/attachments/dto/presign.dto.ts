import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** 허용 파일 형식 — 이미지 + PDF. 실행 가능 파일은 받지 않는다 (보안 체크리스트 §11) */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export class PresignDto {
  @ApiProperty({ example: 'contract.pdf' })
  @IsString()
  @MaxLength(200)
  // 경로 문자를 막아 s3 키 조작 방지
  @Matches(/^[^/\\]+$/, {
    message: 'fileName must not contain path separators',
  })
  fileName: string;

  @ApiProperty({ enum: ALLOWED_MIME_TYPES, example: 'image/jpeg' })
  @IsIn(ALLOWED_MIME_TYPES)
  mimeType: string;

  @ApiProperty({
    example: 123456,
    description: `최대 ${MAX_FILE_SIZE_BYTES} bytes`,
  })
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  sizeBytes: number;
}
