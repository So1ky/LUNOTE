import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../../attachments/dto/presign.dto';

export class AttachmentInputDto {
  @ApiProperty({ example: 'uploads/<userId>/<uuid>/contract.pdf' })
  @IsString()
  @MaxLength(500)
  s3Key: string;

  @ApiProperty({ example: 'contract.pdf' })
  @IsString()
  @MaxLength(200)
  fileName: string;

  @ApiProperty({ enum: ALLOWED_MIME_TYPES })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 123456 })
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  sizeBytes: number;
}

export class CreateQuoteRequestDto {
  @ApiProperty({ enum: Category, example: Category.HOUSING })
  @IsEnum(Category)
  category: Category;

  // 사용자가 제시하는 희망 예산 (선택) — 실제 결제 금액은 관리자 견적(Quote)이 결정한다
  @ApiPropertyOptional({ example: 400, description: '희망 예산 (선택)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000)
  desiredAmount?: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiProperty({
    example:
      'Looking for a one-room apartment near Hongdae, budget $400/month.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ example: 'email: me@example.com' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  contactMethod: string;

  // presign → 업로드 완료 후 메타데이터를 함께 제출
  @ApiPropertyOptional({ type: [AttachmentInputDto], description: '최대 5개' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => AttachmentInputDto)
  attachments?: AttachmentInputDto[];
}
