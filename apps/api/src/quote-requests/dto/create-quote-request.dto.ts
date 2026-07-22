import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

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
}
